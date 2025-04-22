import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { AlertService } from '../alert/alert.service';
import { MailService } from '../mail/mail.service';
import { EventsGateway } from '../events/events.gateway';
import { ImageProcessingService } from '../image-processing/image-processing.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { MlClientService } from '../ml-client/ml-client.service';
import { AlertOrigin, CameraStatus, Role } from '@prisma/client';
import { CreateAlertDto } from '../alert/dto/create-alert.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RealFireDetectionService {
  private readonly logger = new Logger(RealFireDetectionService.name);
  private readonly detectionConfidenceThreshold: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly alertService: AlertService,
    private readonly mailService: MailService,
    private readonly eventsGateway: EventsGateway,
    private readonly imageProcessing: ImageProcessingService,
    private readonly cloudinary: CloudinaryService,
    private readonly mlClient: MlClientService,
    private readonly configService: ConfigService,
  ) {
    this.detectionConfidenceThreshold = +this.configService.get<number>(
      'FIRE_DETECTION_THRESHOLD',
      0.7,
    );
    this.logger.log(
      `Fire detection threshold set to: ${this.detectionConfidenceThreshold}`,
    );
  }

  @Cron(CronExpression.EVERY_30_MINUTES)
  async handleCron() {
    this.logger.log('Running REAL Fire Detection Scan...');
    const camerasToScan = await this.prisma.camera.findMany({
      where: {
        isDetecting: true,
        status: CameraStatus.ONLINE,
      },
      include: { zone: true },
    });

    if (camerasToScan.length === 0) {
      this.logger.log('No cameras enabled for detection or online.');
      return;
    }

    this.logger.log(`Scanning ${camerasToScan.length} cameras...`);
    for (const camera of camerasToScan) {
      await this.processCamera(camera);
    }
    this.logger.log('Finished detection scan cycle.');
  }

  private async processCamera(camera: any) {
    this.logger.debug(`Processing camera: ${camera.name} (ID: ${camera.id})`);
    let imageBuffer: Buffer | null = null;

    try {
      imageBuffer = await this.imageProcessing.captureSnapshot(camera.url);
    } catch (snapshotError: any) {
      this.logger.error(
        `Failed to capture snapshot for camera ${camera.id}: ${snapshotError.message}`,
      );
      return;
    }

    if (!imageBuffer) {
      this.logger.warn(
        `No snapshot obtained for camera ${camera.id}, skipping detection.`,
      );
      return;
    }

    try {
      const imageBase64 = imageBuffer.toString('base64');
      const prediction = await this.mlClient.getFirePrediction(imageBase64);

      if (
        prediction &&
        prediction.label === 'FIRE' &&
        prediction.confidence >= this.detectionConfidenceThreshold
      ) {
        this.logger.warn(
          `🔥🔥🔥 FIRE DETECTED by AI at Camera: ${camera.name} (ID: ${camera.id}) - Confidence: ${prediction.confidence.toFixed(3)}`,
        );
        await this.triggerFireAlert(camera, imageBuffer, prediction.confidence);
      } else if (prediction) {
        this.logger.log(
          `No significant fire detected at Camera: ${camera.name}. Result: ${prediction.label} (${prediction.confidence.toFixed(3)})`,
        );
      } else {
        this.logger.error(
          `Failed to get prediction for camera ${camera.id} from AI service.`,
        );
      }
    } catch (predictionError: any) {
      this.logger.error(
        `Error during prediction process for camera ${camera.id}: ${predictionError.message}`,
      );
    }
  }

  private async triggerFireAlert(
    camera: any,
    imageBuffer: Buffer,
    confidence: number,
  ) {
    let imageUrl: string | null = null;

    try {
      const publicId = `fire_alert_${camera.id}_${Date.now()}`;
      const folder = `fire_alerts/${camera.zone?.name || 'unknown_zone'}`;
      const uploadResult = await this.cloudinary.uploadBuffer(
        imageBuffer,
        publicId,
        folder,
      );
      imageUrl = uploadResult.secure_url;
      this.logger.log(`Snapshot uploaded: ${imageUrl}`);
    } catch (uploadError: any) {
      this.logger.error(
        `Failed to upload snapshot for alert (Cam ${camera.id}): ${uploadError.message}`,
      );
    }

    const alertMessage = `FIRE DETECTED by AI at camera '${camera.name}' (Zone: ${camera.zone?.name || 'N/A'}). Confidence: ${confidence.toFixed(2)}`;
    const alertDto: CreateAlertDto = {
      message: alertMessage,
      origin: AlertOrigin.ML_DETECTION,
      cameraId: camera.id,
      sensorId: undefined,
      imageUrl: imageUrl ?? undefined,
      viaEmail: true,
    };

    try {
      const createdAlert = await this.alertService.create(alertDto);
      this.logger.log(
        `Created Fire Alert ${createdAlert.id} from AI detection`,
      );

      try {
        const alertToSend = await this.prisma.alert.findUnique({
          where: { id: createdAlert.id },
          include: {
            camera: {
              select: { name: true, zone: { select: { name: true } } },
            },
          },
        });
        if (alertToSend) this.eventsGateway.sendNewAlert(alertToSend);
      } catch (wsError: any) {
        this.logger.error(
          `WS emit error for alert ${createdAlert.id}: ${wsError.message}`,
        );
      }

      try {
        const usersToNotify = await this.prisma.user.findMany({
          where: {
            role: { in: [Role.ADMIN, Role.SUPERVISOR] },
            isActive: true,
          },
          select: { email: true },
        });
        const subject = `🔥 URGENT AI FIRE ALERT: ${camera.name} - ${camera.zone?.name || 'Unknown Zone'}`;

        if (usersToNotify.length > 0) {
          this.logger.log(
            `Notifying ${usersToNotify.length} users via email...`,
          );
          await Promise.allSettled(
            usersToNotify.map((user) =>
              this.mailService
                .sendAlertEmail(
                  user.email,
                  subject,
                  alertMessage,
                  imageUrl || undefined,
                )
                .catch((mailError) =>
                  this.logger.error(
                    `Failed email to ${user.email}: ${mailError.message}`,
                  ),
                ),
            ),
          );
        } else {
          this.logger.warn(
            'No active Admin/Supervisor users found to notify via email.',
          );
        }
      } catch (notifError: any) {
        this.logger.error(
          `Email notification error for alert ${createdAlert.id}: ${notifError.message}`,
        );
      }
    } catch (alertError: any) {
      this.logger.error(
        `Failed to create/notify fire alert for camera ${camera.id}: ${alertError.message}`,
      );
    }
  }
}

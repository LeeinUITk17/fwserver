import {
  Injectable,
  NotFoundException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAlertDto } from './dto/create-alert.dto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { Alert, AlertStatus, Prisma } from '@prisma/client';

interface FindAllAlertsQuery {
  page?: number;
  limit?: number;
  status?: AlertStatus;
  startDate?: string;
  endDate?: string;
}

@Injectable()
export class AlertService {
  private readonly logger = new Logger(AlertService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  async create(
    createAlertDto: CreateAlertDto,
    file?: Express.Multer.File,
  ): Promise<Alert> {
    let imageUrlFromUpload: string | undefined = undefined;

    if (file && !createAlertDto.imageUrl) {
      try {
        const uploadResult = await this.cloudinary.uploadFile(file);
        imageUrlFromUpload = uploadResult.secure_url;
        this.logger.log(
          `File uploaded via AlertService create: ${imageUrlFromUpload}`,
        );
      } catch (uploadError: any) {
        this.logger.error(
          `Cloudinary upload failed in AlertService create: ${uploadError.message}`,
          uploadError.stack,
        );
      }
    }

    const { sensorId, userId, cameraId, imageUrl, ...restDataFromDto } =
      createAlertDto;

    const finalImageUrl = imageUrl ?? imageUrlFromUpload;

    const dataToCreate: Prisma.AlertCreateInput = {
      ...restDataFromDto,
      imageUrl: finalImageUrl,
      status: AlertStatus.PENDING,
      camera: cameraId ? { connect: { id: cameraId } } : undefined,
      sensor: sensorId ? { connect: { id: sensorId } } : undefined,
      user: userId ? { connect: { id: userId } } : undefined,
    };

    Object.keys(dataToCreate).forEach((key) => {
      if (dataToCreate[key] === undefined) {
        delete dataToCreate[key];
      }
    });

    try {
      this.logger.debug(
        `Attempting to create alert with prisma data: ${JSON.stringify(dataToCreate)}`,
      );
      const newAlert = await this.prisma.alert.create({
        data: dataToCreate,
      });
      this.logger.log(`Successfully created alert ID: ${newAlert.id}`);
      return newAlert;
    } catch (dbError: any) {
      this.logger.error(
        `Failed to create alert in DB: ${dbError.message}`,
        dbError.stack,
      );
      throw dbError;
    }
  }

  async findAll(
    query: FindAllAlertsQuery,
  ): Promise<{ data: any[]; total: number }> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.AlertWhereInput = {};
    if (query.status) {
      where.status = query.status;
    }
    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        const endDate = new Date(query.endDate);
        endDate.setDate(endDate.getDate() + 1);
        where.createdAt.lt = endDate;
      }
    }

    const [alerts, total] = await this.prisma.$transaction([
      this.prisma.alert.findMany({
        where,
        skip: skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          sensor: {
            include: {
              zone: true,
            },
          },
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      this.prisma.alert.count({ where }),
    ]);

    return { data: alerts, total: total };
  }

  async findOne(id: string) {
    this.logger.log(`Fetching details for alert ID: ${id}`);
    const alert = await this.prisma.alert.findUnique({
      where: { id },
      include: {
        sensor: { include: { zone: true } },
        user: { select: { id: true, name: true, email: true } },
        camera: true,
      },
    });

    if (!alert) {
      throw new NotFoundException(`Alert with ID ${id} not found`);
    }
    return alert;
  }

  async getStats(): Promise<{
    pending: number;
    resolvedToday?: number;
    totalToday?: number;
  }> {
    try {
      const pendingCount = await this.prisma.alert.count({
        where: { status: AlertStatus.PENDING },
      });

      const stats = {
        pending: pendingCount,
      };

      return stats;
    } catch (error) {
      this.logger.error('Failed to fetch alert stats:', error.stack);
      throw new InternalServerErrorException(
        'Could not fetch alert statistics.',
      );
    }
  }

  async updateStatus(
    alertId: string,
    newStatus: AlertStatus,
    userId: string,
  ): Promise<Alert> {
    this.logger.log(
      `Updating status for alert ${alertId} to ${newStatus} by user ${userId}`,
    );
    try {
      const existingAlert = await this.prisma.alert.findUnique({
        where: { id: alertId },
      });
      if (!existingAlert) {
        throw new NotFoundException(`Alert with ID ${alertId} not found`);
      }

      const updatedAlert = await this.prisma.alert.update({
        where: { id: alertId },
        data: {
          status: newStatus,
          userId: userId,
        },
        include: {
          sensor: { include: { zone: true } },
          user: { select: { id: true, name: true, email: true } },
          camera: true,
        },
      });
      this.logger.log(`Alert ${alertId} status updated to ${newStatus}`);
      return updatedAlert;
    } catch (error) {
      this.logger.error(
        `Failed to update status for alert ${alertId}:`,
        error.stack,
      );
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw error;
      }
      throw new InternalServerErrorException('Could not update alert status.');
    }
  }
}

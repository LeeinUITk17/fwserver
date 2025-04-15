import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAlertDto } from './dto/create-alert.dto';
import * as player from 'play-sound';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { Alert, Prisma } from '@prisma/client';

@Injectable()
export class AlertService {
  private readonly logger = new Logger(AlertService.name);
  private audio;

  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {
    this.audio = player();
  }

  async create(
    createAlertDto: CreateAlertDto,
    file?: Express.Multer.File,
  ): Promise<Alert> {
    let imageUrl: string | undefined = undefined;

    if (file) {
      this.logger.log(`File received for alert creation, attempting upload...`);
      try {
        const uploadResult = await this.cloudinary.uploadFile(file);
        imageUrl = uploadResult.secure_url;
        this.logger.log(`Image uploaded successfully: ${imageUrl}`);
      } catch (uploadError) {
        this.logger.error(
          `Cloudinary upload failed: ${uploadError.message}`,
          uploadError.stack,
        );
        imageUrl = undefined;
      }
    } else {
      this.logger.log(`No file provided for alert creation.`);
    }

    const { sensorId, userId, ...rest } = createAlertDto;

    const createData: Prisma.AlertCreateInput = {
      ...rest,
      imageUrl: imageUrl,
      sensor: { connect: { id: sensorId } },
    };

    if (userId) {
      createData.user = { connect: { id: userId } };
    }

    try {
      const newAlert = await this.prisma.alert.create({
        data: createData,
      });
      this.logger.log(`Alert ${newAlert.id} created in database.`);
      return newAlert;
    } catch (dbError) {
      this.logger.error(
        `Failed to create alert in DB: ${dbError.message}`,
        dbError.stack,
      );
      throw dbError;
    }
  }

  async findAll() {
    return this.prisma.alert.findMany({
      include: {
        sensor: true,
        user: true,
        camera: true,
      },
    });
  }

  async findOne(id: string) {
    const alert = await this.prisma.alert.findUnique({
      where: { id },
      include: {
        sensor: true,
        user: true,
        camera: true,
      },
    });

    if (!alert) {
      throw new NotFoundException(`Alert with ID ${id} not found`);
    }

    return alert;
  }

  // async update(id: string, updateAlertDto: UpdateAlertDto) {
  //   const alert = await this.prisma.alert.findUnique({ where: { id } });

  //   if (!alert) {
  //     throw new NotFoundException(`Alert with ID ${id} not found`);
  //   }

  //   const { sensorId, userId, cameraId, ...rest } = updateAlertDto;

  //   const updateData: any = { ...rest };

  //   if (sensorId) {
  //     updateData.sensor = { connect: { id: sensorId } };
  //   }

  //   if (userId) {
  //     updateData.user = { connect: { id: userId } };
  //   }

  //   if (cameraId) {
  //     updateData.camera = { connect: { id: cameraId } };
  //   }

  //   return this.prisma.alert.update({
  //     where: { id },
  //     data: updateData,
  //   });
  // }

  // async remove(id: string) {
  //   const alert = await this.prisma.alert.findUnique({ where: { id } });

  //   if (!alert) {
  //     throw new NotFoundException(`Alert with ID ${id} not found`);
  //   }

  //   return this.prisma.alert.delete({
  //     where: { id },
  //   });
  // }
}

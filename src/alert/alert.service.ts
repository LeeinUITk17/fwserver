import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAlertDto } from './dto/create-alert.dto';
import * as player from 'play-sound';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { Alert, AlertStatus, Prisma } from '@prisma/client';

interface FindAllAlertsQuery {
  page?: number;
  limit?: number;
  status?: AlertStatus;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  // sortBy?: string;
  // sortOrder?: 'asc' | 'desc';
  // sensorId?: string;
}
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

  async findAll(
    query: FindAllAlertsQuery,
  ): Promise<{ data: any[]; total: number }> {
    // Trả về cấu trúc mới
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    // Xây dựng điều kiện WHERE động
    const where: Prisma.AlertWhereInput = {};
    if (query.status) {
      where.status = query.status;
    }
    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = new Date(query.startDate); // >= start date
      }
      if (query.endDate) {
        // Thêm 1 ngày để bao gồm cả ngày kết thúc
        const endDate = new Date(query.endDate);
        endDate.setDate(endDate.getDate() + 1);
        where.createdAt.lt = endDate; // < end date + 1 day
      }
    }
    // Thêm các điều kiện lọc khác nếu cần (vd: where.sensorId = query.sensorId)

    // Xây dựng điều kiện ORDER BY động (ví dụ)
    // const orderBy: Prisma.AlertOrderByWithRelationInput = {};
    // const sortBy = query.sortBy || 'createdAt';
    // const sortOrder = query.sortOrder || 'desc';
    // orderBy[sortBy] = sortOrder;

    // Sử dụng transaction để lấy cả data và total count hiệu quả
    const [alerts, total] = await this.prisma.$transaction([
      this.prisma.alert.findMany({
        where,
        skip: skip,
        take: limit,
        orderBy: {
          createdAt: 'desc', // Mặc định sắp xếp mới nhất trước
        },
        // Include các relations cần thiết cho frontend
        include: {
          sensor: {
            include: {
              zone: true,
            },
          },
          user: {
            // Include user nếu cần hiển thị người xử lý
            select: { id: true, name: true, email: true },
          },
          // camera: true, // Include camera nếu cần
        },
      }),
      this.prisma.alert.count({ where }), // Đếm tổng số bản ghi khớp điều kiện WHERE
    ]);

    return { data: alerts, total: total }; // Trả về đúng cấu trúc
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

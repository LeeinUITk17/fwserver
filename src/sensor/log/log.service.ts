import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateLogDto } from './dto/create-log.dto';
import { UpdateLogDto } from './dto/update-log.dto';
import * as dayjs from 'dayjs';

@Injectable()
export class LogService {
  private readonly logger = new Logger(LogService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createLogDto: CreateLogDto) {
    return this.prisma.sensorLog.create({
      data: createLogDto,
    });
  }

  async findAll() {
    return this.prisma.sensorLog.findMany({
      include: {
        sensor: true,
      },
    });
  }

  async findOne(id: string) {
    const log = await this.prisma.sensorLog.findUnique({
      where: { id },
      include: {
        sensor: true,
      },
    });

    if (!log) {
      throw new NotFoundException(`Log with ID ${id} not found`);
    }

    return log;
  }

  async update(id: string, updateLogDto: UpdateLogDto) {
    const log = await this.prisma.sensorLog.findUnique({ where: { id } });

    if (!log) {
      throw new NotFoundException(`Log with ID ${id} not found`);
    }

    return this.prisma.sensorLog.update({
      where: { id },
      data: updateLogDto,
    });
  }

  async remove(id: string) {
    const log = await this.prisma.sensorLog.findUnique({ where: { id } });

    if (!log) {
      throw new NotFoundException(`Log with ID ${id} not found`);
    }

    return this.prisma.sensorLog.delete({
      where: { id },
    });
  }

  async getStats(rangeHours: number = 24): Promise<{
    averageTemperature: number | null;
    averageHumidity: number | null;
  }> {
    this.logger.log(
      `Fetching sensor log stats for the last ${rangeHours} hours...`,
    );

    try {
      const startTime = dayjs().subtract(rangeHours, 'hour').toDate();

      const result = await this.prisma.sensorLog.aggregate({
        _avg: {
          temperature: true,
          humidity: true,
        },
        where: {
          createdAt: {
            gte: startTime,
          },
          temperature: { not: null },
        },
      });

      const stats = {
        averageTemperature: result._avg.temperature,
        averageHumidity: result._avg.humidity,
      };

      this.logger.log(`Sensor log stats fetched: ${JSON.stringify(stats)}`);
      return stats;
    } catch (error) {
      this.logger.error('Failed to fetch sensor log stats:', error.stack);
      throw new InternalServerErrorException(
        'Could not fetch sensor log statistics.',
      );
    }
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateLogDto } from './dto/create-log.dto';
import { UpdateLogDto } from './dto/update-log.dto';

@Injectable()
export class LogService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createLogDto: CreateLogDto) {
    return this.prisma.sensorLog.create({
      data: createLogDto,
    });
  }

  async findAll() {
    return this.prisma.sensorLog.findMany({
      include: {
        sensor: true, // Include related sensor data
      },
    });
  }

  async findOne(id: string) {
    const log = await this.prisma.sensorLog.findUnique({
      where: { id },
      include: {
        sensor: true, // Include related sensor data
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
}

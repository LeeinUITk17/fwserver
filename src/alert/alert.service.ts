import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAlertDto } from './dto/create-alert.dto';
import { UpdateAlertDto } from './dto/update-alert.dto';

@Injectable()
export class AlertService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createAlertDto: CreateAlertDto) {
    return this.prisma.alert.create({
      data: createAlertDto,
    });
  }

  async findAll() {
    return this.prisma.alert.findMany({
      include: {
        sensor: true,
        user: true,
      },
    });
  }

  async findOne(id: string) {
    const alert = await this.prisma.alert.findUnique({
      where: { id },
      include: {
        sensor: true,
        user: true,
      },
    });

    if (!alert) {
      throw new NotFoundException(`Alert with ID ${id} not found`);
    }

    return alert;
  }

  async update(id: string, updateAlertDto: UpdateAlertDto) {
    const alert = await this.prisma.alert.findUnique({ where: { id } });

    if (!alert) {
      throw new NotFoundException(`Alert with ID ${id} not found`);
    }

    return this.prisma.alert.update({
      where: { id },
      data: updateAlertDto,
    });
  }

  async remove(id: string) {
    const alert = await this.prisma.alert.findUnique({ where: { id } });

    if (!alert) {
      throw new NotFoundException(`Alert with ID ${id} not found`);
    }

    return this.prisma.alert.delete({
      where: { id },
    });
  }
}

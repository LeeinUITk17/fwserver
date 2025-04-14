import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSensorDto } from './dto/create-sensor.dto';
import { UpdateSensorDto } from './dto/update-sensor.dto';

@Injectable()
export class SensorService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createSensorDto: CreateSensorDto) {
    return this.prisma.sensor.create({
      data: createSensorDto,
    });
  }

  async findAll() {
    return this.prisma.sensor.findMany({
      include: {
        zone: true, // Include related zone data
      },
    });
  }

  async findOne(id: string) {
    const sensor = await this.prisma.sensor.findUnique({
      where: { id },
      include: {
        zone: true, // Include related zone data
      },
    });

    if (!sensor) {
      throw new NotFoundException(`Sensor with ID ${id} not found`);
    }

    return sensor;
  }

  async update(id: string, updateSensorDto: UpdateSensorDto) {
    const sensor = await this.prisma.sensor.findUnique({ where: { id } });

    if (!sensor) {
      throw new NotFoundException(`Sensor with ID ${id} not found`);
    }

    return this.prisma.sensor.update({
      where: { id },
      data: updateSensorDto,
    });
  }

  async remove(id: string) {
    const sensor = await this.prisma.sensor.findUnique({ where: { id } });

    if (!sensor) {
      throw new NotFoundException(`Sensor with ID ${id} not found`);
    }

    return this.prisma.sensor.delete({
      where: { id },
    });
  }
}

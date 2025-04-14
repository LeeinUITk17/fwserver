import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateZoneDto } from './dto/create-zone.dto';
import { UpdateZoneDto } from './dto/update-zone.dto';

@Injectable()
export class ZoneService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createZoneDto: CreateZoneDto) {
    return this.prisma.zone.create({
      data: createZoneDto,
    });
  }

  async findAll() {
    return this.prisma.zone.findMany({
      include: {
        sensors: true, // Include related sensors
        cameras: true, // Include related cameras
      },
    });
  }

  async findOne(id: string) {
    const zone = await this.prisma.zone.findUnique({
      where: { id },
      include: {
        sensors: true, // Include related sensors
        cameras: true, // Include related cameras
      },
    });

    if (!zone) {
      throw new NotFoundException(`Zone with ID ${id} not found`);
    }

    return zone;
  }

  async update(id: string, updateZoneDto: UpdateZoneDto) {
    const zone = await this.prisma.zone.findUnique({ where: { id } });

    if (!zone) {
      throw new NotFoundException(`Zone with ID ${id} not found`);
    }

    return this.prisma.zone.update({
      where: { id },
      data: updateZoneDto,
    });
  }

  async remove(id: string) {
    const zone = await this.prisma.zone.findUnique({ where: { id } });

    if (!zone) {
      throw new NotFoundException(`Zone with ID ${id} not found`);
    }

    return this.prisma.zone.delete({
      where: { id },
    });
  }
}

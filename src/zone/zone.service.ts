import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateZoneDto } from './dto/create-zone.dto';
import { UpdateZoneDto } from './dto/update-zone.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ZoneService {
  private readonly logger = new Logger(ZoneService.name);
  constructor(private readonly prisma: PrismaService) {}

  async create(createZoneDto: CreateZoneDto) {
    return this.prisma.zone.create({
      data: createZoneDto,
    });
  }
  async createBulk(
    createZoneDtos: CreateZoneDto[],
  ): Promise<{ count: number }> {
    if (!createZoneDtos || createZoneDtos.length === 0) {
      return { count: 0 };
    }

    try {
      const result = await this.prisma.zone.createMany({
        data: createZoneDtos,
        skipDuplicates: true,
      });

      this.logger.log(`Successfully created ${result.count} zones in bulk.`);
      return result;
    } catch (error) {
      this.logger.error(
        `Failed to bulk create zones: ${error.message}`,
        error.stack,
      );
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        this.logger.error(`Prisma Error Code: ${error.code}`);
      }
      throw new InternalServerErrorException('Could not create zones in bulk.');
    }
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
  async findList() {
    this.logger.log('Fetching zone list (id, name)...');
    return this.prisma.zone.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }
}

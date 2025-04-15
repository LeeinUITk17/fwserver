import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSensorDto } from './dto/create-sensor.dto';
import { UpdateSensorDto } from './dto/update-sensor.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class SensorService {
  private readonly logger = new Logger(SensorService.name);
  constructor(private readonly prisma: PrismaService) {}

  async create(createSensorDto: CreateSensorDto) {
    const { zoneId, ...rest } = createSensorDto;

    const createData: any = { ...rest };

    // If zoneId is provided, transform it to Prisma's expected format
    if (zoneId) {
      createData.zone = { connect: { id: zoneId } };
    }

    return this.prisma.sensor.create({
      data: createData,
    });
  }
  async createBulk(
    createSensorDtos: CreateSensorDto[],
  ): Promise<{ count: number }> {
    if (!createSensorDtos || createSensorDtos.length === 0) {
      return { count: 0 };
    }

    const zoneIds = [...new Set(createSensorDtos.map((dto) => dto.zoneId))];
    const existingZones = await this.prisma.zone.findMany({
      where: { id: { in: zoneIds } },
      select: { id: true },
    });
    const existingZoneIds = new Set(existingZones.map((z) => z.id));

    const invalidDtos = createSensorDtos.filter(
      (dto) => !existingZoneIds.has(dto.zoneId),
    );
    if (invalidDtos.length > 0) {
      const invalidZoneIds = [...new Set(invalidDtos.map((dto) => dto.zoneId))];
      this.logger.error(
        `Invalid or non-existent Zone IDs provided: ${invalidZoneIds.join(', ')}`,
      );
      throw new NotFoundException(
        `The following Zone IDs do not exist: ${invalidZoneIds.join(', ')}`,
      );
    }

    try {
      const result = await this.prisma.sensor.createMany({
        data: createSensorDtos.map((dto) => ({
          ...dto,
          status: dto.status ?? undefined,
        })),
        skipDuplicates: true,
      });

      this.logger.log(`Successfully created ${result.count} sensors in bulk.`);
      return result;
    } catch (error) {
      this.logger.error(
        `Failed to bulk create sensors: ${error.message}`,
        error.stack,
      );
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        this.logger.error(`Prisma Error Code: ${error.code}`);
      }
      throw new InternalServerErrorException(
        'Could not create sensors in bulk.',
      );
    }
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
    const { zoneId, ...rest } = updateSensorDto;

    const updateData: any = { ...rest };

    // If zoneId is provided, transform it to Prisma's expected format
    if (zoneId) {
      updateData.zone = { connect: { id: zoneId } };
    }

    const sensor = await this.prisma.sensor.findUnique({ where: { id } });

    if (!sensor) {
      throw new NotFoundException(`Sensor with ID ${id} not found`);
    }

    return this.prisma.sensor.update({
      where: { id },
      data: updateData,
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

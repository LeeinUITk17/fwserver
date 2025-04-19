import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSensorDto } from './dto/create-sensor.dto';
import { UpdateSensorDto } from './dto/update-sensor.dto';
import { Prisma, SensorStatus } from '@prisma/client';

@Injectable()
export class SensorService {
  private readonly logger = new Logger(SensorService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createSensorDto: CreateSensorDto) {
    const { zoneId, ...rest } = createSensorDto;
    const createData: any = { ...rest };

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

  async findAll(query?: {
    zoneId?: string;
    status?: SensorStatus;
    page?: number;
    limit?: number;
  }) {
    const page = query?.page || 1;
    const limit = query?.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.SensorWhereInput = {};
    if (query?.zoneId) where.zoneId = query.zoneId;
    if (query?.status) where.status = query.status;

    const sensors = await this.prisma.sensor.findMany({
      where,
      skip,
      take: limit,
      include: {
        zone: true,
        logs: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return sensors.map((sensor) => {
      const { logs, ...restOfSensor } = sensor;
      return {
        ...restOfSensor,
        latestLog: logs?.[0] || null,
      };
    });
  }

  async findOne(id: string) {
    const sensor = await this.prisma.sensor.findUnique({
      where: { id },
      include: {
        zone: true,
        logs: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    if (!sensor) {
      throw new NotFoundException(`Sensor with ID ${id} not found`);
    }

    return sensor;
  }

  async update(id: string, updateSensorDto: UpdateSensorDto) {
    const { zoneId, ...rest } = updateSensorDto;

    const sensor = await this.prisma.sensor.findUnique({ where: { id } });
    if (!sensor) {
      throw new NotFoundException(`Sensor with ID ${id} not found`);
    }

    const updateData: Prisma.SensorUpdateInput = { ...rest };

    if (zoneId) {
      const zoneExists = await this.prisma.zone.findUnique({
        where: { id: zoneId },
        select: { id: true },
      });
      if (!zoneExists) {
        throw new NotFoundException(`Zone with ID ${zoneId} not found`);
      }
      updateData.zone = { connect: { id: zoneId } };
    }

    this.logger.log(
      `Updating sensor ${id} with data: ${JSON.stringify(updateData)}`,
    );
    try {
      return await this.prisma.sensor.update({
        where: { id },
        data: updateData,
        include: {
          zone: true,
          logs: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
      });
    } catch (error) {
      this.logger.error(`Failed to update sensor ${id}:`, error.stack);
      throw new InternalServerErrorException('Could not update sensor.');
    }
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

  async getStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    error: number;
    maintenance: number;
  }> {
    this.logger.log('Fetching sensor stats...');
    try {
      const statusCounts = await this.prisma.sensor.groupBy({
        by: ['status'],
        _count: {
          status: true,
        },
      });

      const stats = {
        total: 0,
        active: 0,
        inactive: 0,
        error: 0,
        maintenance: 0,
      };

      statusCounts.forEach((item) => {
        const count = item._count.status;
        stats.total += count;
        switch (item.status) {
          case SensorStatus.ACTIVE:
            stats.active = count;
            break;
          case SensorStatus.INACTIVE:
            stats.inactive = count;
            break;
          case SensorStatus.ERROR:
            stats.error = count;
            break;
          case SensorStatus.MAINTENANCE:
            stats.maintenance = count;
            break;
        }
      });

      this.logger.log(`Sensor stats fetched: ${JSON.stringify(stats)}`);
      return stats;
    } catch (error) {
      this.logger.error('Failed to fetch sensor stats:', error.stack);
      throw new InternalServerErrorException(
        'Could not fetch sensor statistics.',
      );
    }
  }
}

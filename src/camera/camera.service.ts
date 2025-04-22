import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCameraDto } from './dto/create-camera.dto';
import { UpdateCameraDto } from './dto/update-camera.dto';

@Injectable()
export class CameraService {
  private readonly logger = new Logger(CameraService.name);
  constructor(private readonly prisma: PrismaService) {}

  async create(createCameraDto: CreateCameraDto) {
    return this.prisma.camera.create({
      data: createCameraDto,
    });
  }

  async findAll() {
    return this.prisma.camera.findMany({
      include: {
        zone: true, // Include related zone data
      },
    });
  }

  async findOne(id: string) {
    const camera = await this.prisma.camera.findUnique({
      where: { id },
      include: {
        zone: true, // Include related zone data
      },
    });

    if (!camera) {
      throw new NotFoundException(`Camera with ID ${id} not found`);
    }

    return camera;
  }

  async update(id: string, updateCameraDto: UpdateCameraDto) {
    const camera = await this.prisma.camera.findUnique({ where: { id } });

    if (!camera) {
      throw new NotFoundException(`Camera with ID ${id} not found`);
    }

    return this.prisma.camera.update({
      where: { id },
      data: updateCameraDto,
    });
  }

  async remove(id: string) {
    const camera = await this.prisma.camera.findUnique({ where: { id } });

    if (!camera) {
      throw new NotFoundException(`Camera with ID ${id} not found`);
    }

    return this.prisma.camera.delete({
      where: { id },
    });
  }
  async getStats(): Promise<{ total: number }> {
    this.logger.log('Fetching camera stats...');
    try {
      const totalCount = await this.prisma.camera.count();
      const stats = { total: totalCount };
      this.logger.log(`Camera stats fetched: ${JSON.stringify(stats)}`);
      return stats;
    } catch (error) {
      this.logger.error('Failed to fetch camera stats:', error.stack);
      throw new InternalServerErrorException(
        'Could not fetch camera statistics.',
      );
    }
  }
  async findOneSimple(id: string) {
    const camera = await this.prisma.camera.findUnique({
      where: { id },
      select: {
        url: true,
      },
    });

    if (!camera) {
      throw new NotFoundException(`Camera with ID ${id} not found`);
    }

    return camera;
  }
}

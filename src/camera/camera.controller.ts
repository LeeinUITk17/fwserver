import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  NotFoundException,
  StreamableFile,
  Res,
} from '@nestjs/common';
import { CameraService } from './camera.service';
import { CreateCameraDto } from './dto/create-camera.dto';
import { UpdateCameraDto } from './dto/update-camera.dto';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from 'src/auth/admin.gaurd';
import { ImageProcessingService } from 'src/image-processing/image-processing.service';

@Controller('cameras')
@UseGuards(AuthGuard('jwt'), AdminGuard)
export class CameraController {
  constructor(
    private readonly cameraService: CameraService,
    private readonly imageProcessingService: ImageProcessingService, // Inject ImageProcessingService
  ) {}
  @Get('stats') // Route: GET /cameras/stats
  async getStats() {
    return this.cameraService.getStats();
  }
  @Post()
  async create(@Body() createCameraDto: CreateCameraDto) {
    return this.cameraService.create(createCameraDto);
  }

  @Get()
  async findAll() {
    return this.cameraService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.cameraService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCameraDto: UpdateCameraDto,
  ) {
    return this.cameraService.update(id, updateCameraDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.cameraService.remove(id);
  }
  async getSnapshot(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: any,
  ): Promise<StreamableFile | { error: string }> {
    try {
      const camera = await this.cameraService.findOneSimple(id); // Fetch camera URL
      if (!camera || !camera.url) {
        throw new NotFoundException(
          `Camera with ID ${id} not found or has no URL.`,
        );
      }

      const imageBuffer = await this.imageProcessingService.captureSnapshot(
        camera.url,
      );

      if (imageBuffer) {
        res.set({
          'Content-Type': 'image/jpeg',
        });
        return new StreamableFile(imageBuffer);
      } else {
        throw new NotFoundException(
          `Could not capture snapshot for camera ${id}. Check camera URL and status.`,
        );
      }
    } catch (error: any) {
      console.error(`Error getting snapshot for camera ${id}:`, error);
      if (error instanceof NotFoundException) {
        res.status(404);
        return { error: error.message };
      }
      res.status(500);
      return { error: 'Failed to retrieve snapshot.' };
    }
  }
}

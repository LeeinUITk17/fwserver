import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { CameraService } from './camera.service';
import { CreateCameraDto } from './dto/create-camera.dto';
import { UpdateCameraDto } from './dto/update-camera.dto';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from 'src/auth/admin.gaurd';

@Controller('cameras')
@UseGuards(AuthGuard('jwt'), AdminGuard)
export class CameraController {
  constructor(private readonly cameraService: CameraService) {}
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
}

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { CameraService } from './camera.service';
import { CreateCameraDto } from './dto/create-camera.dto';
import { UpdateCameraDto } from './dto/update-camera.dto';

@Controller('cameras')
export class CameraController {
  constructor(private readonly cameraService: CameraService) {}

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

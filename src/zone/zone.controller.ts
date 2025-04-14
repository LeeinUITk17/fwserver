import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ZoneService } from './zone.service';
import { CreateZoneDto } from './dto/create-zone.dto';
import { UpdateZoneDto } from './dto/update-zone.dto';

@Controller('zones')
export class ZoneController {
  constructor(private readonly zoneService: ZoneService) {}

  @Post()
  async create(@Body() createZoneDto: CreateZoneDto) {
    return this.zoneService.create(createZoneDto);
  }

  @Get()
  async findAll() {
    return this.zoneService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.zoneService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateZoneDto: UpdateZoneDto) {
    return this.zoneService.update(id, updateZoneDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.zoneService.remove(id);
  }
}

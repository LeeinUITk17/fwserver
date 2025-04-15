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
import { ZoneService } from './zone.service';
import { CreateZoneDto } from './dto/create-zone.dto';
import { UpdateZoneDto } from './dto/update-zone.dto';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from 'src/auth/admin.gaurd';
@Controller('zones')
@UseGuards(AuthGuard('jwt'), AdminGuard)
export class ZoneController {
  constructor(private readonly zoneService: ZoneService) {}

  @Post()
  async create(@Body() createZoneDto: CreateZoneDto) {
    return this.zoneService.create(createZoneDto);
  }
  @Post('bulk')
  async createBulk(@Body() createZoneDtos: CreateZoneDto[]) {
    return this.zoneService.createBulk(createZoneDtos);
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

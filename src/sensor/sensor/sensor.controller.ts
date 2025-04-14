import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { SensorService } from './sensor.service';
import { CreateSensorDto } from './dto/create-sensor.dto';
import { UpdateSensorDto } from './dto/update-sensor.dto';

@Controller('sensors')
export class SensorController {
  constructor(private readonly sensorService: SensorService) {}

  @Post()
  async create(@Body() createSensorDto: CreateSensorDto) {
    return this.sensorService.create(createSensorDto);
  }

  @Get()
  async findAll() {
    return this.sensorService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.sensorService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateSensorDto: UpdateSensorDto,
  ) {
    return this.sensorService.update(id, updateSensorDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.sensorService.remove(id);
  }
}

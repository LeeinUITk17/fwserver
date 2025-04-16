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
import { SensorService } from './sensor.service';
import { CreateSensorDto } from './dto/create-sensor.dto';
import { UpdateSensorDto } from './dto/update-sensor.dto';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from 'src/auth/admin.gaurd';

@Controller('sensors')
@UseGuards(AuthGuard('jwt'), AdminGuard)
export class SensorController {
  constructor(private readonly sensorService: SensorService) {}
  @Get('stats') // Route: GET /sensors/stats
  async getStats() {
    return this.sensorService.getStats();
  }
  @Post()
  async create(@Body() createSensorDto: CreateSensorDto) {
    return this.sensorService.create(createSensorDto);
  }
  @Post('bulk')
  async createBulk(@Body() createSensorDtos: CreateSensorDto[]) {
    return this.sensorService.createBulk(createSensorDtos);
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

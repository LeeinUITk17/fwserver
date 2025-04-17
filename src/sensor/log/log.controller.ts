import {
  Controller,
  Get,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseArrayPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { LogService } from './log.service';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from 'src/auth/admin.gaurd';

@Controller('logs')
@UseGuards(AuthGuard('jwt'), AdminGuard)
export class LogController {
  constructor(private readonly logService: LogService) {}

  @Get('stats')
  async getStats() {
    return this.logService.getStats();
  }
  @Get('chart')
  async getChartData(
    @Query(
      'sensorIds',
      new DefaultValuePipe([]),
      new ParseArrayPipe({ items: String, separator: ',', optional: true }),
    )
    sensorIds: string[],
    @Query('startTime') startTime?: string,
    @Query('endTime') endTime?: string,
  ) {
    if (!sensorIds || sensorIds.length === 0) {
      return {};
    }
    const start = startTime ? new Date(startTime) : undefined;
    const end = endTime ? new Date(endTime) : undefined;

    return this.logService.getChartData(sensorIds, start, end);
  }

  @Get()
  async findAll() {
    return this.logService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.logService.findOne(id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.logService.remove(id);
  }
}

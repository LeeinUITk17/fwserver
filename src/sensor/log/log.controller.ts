import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { LogService } from './log.service';
import { CreateLogDto } from './dto/create-log.dto';
import { UpdateLogDto } from './dto/update-log.dto';

@Controller('logs')
export class LogController {
  constructor(private readonly logService: LogService) {}

  @Post()
  async create(@Body() createLogDto: CreateLogDto) {
    return this.logService.create(createLogDto);
  }

  @Get()
  async findAll() {
    return this.logService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.logService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateLogDto: UpdateLogDto) {
    return this.logService.update(id, updateLogDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.logService.remove(id);
  }
}

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { AlertService } from './alert.service';
import { CreateAlertDto } from './dto/create-alert.dto';
import { UpdateAlertDto } from './dto/update-alert.dto';

@Controller('alerts')
export class AlertController {
  constructor(private readonly alertService: AlertService) {}

  @Post()
  async create(@Body() createAlertDto: CreateAlertDto) {
    return this.alertService.create(createAlertDto);
  }

  @Get()
  async findAll() {
    return this.alertService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.alertService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateAlertDto: UpdateAlertDto,
  ) {
    return this.alertService.update(id, updateAlertDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.alertService.remove(id);
  }
}

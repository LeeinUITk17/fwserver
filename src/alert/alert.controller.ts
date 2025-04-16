import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AlertService } from './alert.service';
import { CreateAlertDto } from './dto/create-alert.dto';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from 'src/auth/admin.gaurd';

@Controller('alerts')
@UseGuards(AuthGuard('jwt'), AdminGuard)
export class AlertController {
  constructor(private readonly alertService: AlertService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file')) // Handle file uploads
  async create(
    @Body() createAlertDto: CreateAlertDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.alertService.create(createAlertDto, file);
  }
  @Get('stats') // Route: GET /alerts/stats
  async getStats() {
    return this.alertService.getStats();
  }
  @Get()
  async findAll(@Query() query: any) {
    if (query.page) query.page = parseInt(query.page, 10);
    if (query.limit) query.limit = parseInt(query.limit, 10);
    return this.alertService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.alertService.findOne(id);
  }

  // @Patch(':id')
  // async update(
  //   @Param('id') id: string,
  //   @Body() updateAlertDto: UpdateAlertDto,
  // ) {
  //   return this.alertService.update(id, updateAlertDto);
  // }

  // @Delete(':id')
  // async remove(@Param('id') id: string) {
  //   return this.alertService.remove(id);
  // }
}

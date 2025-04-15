import { Controller, Get, Param, Delete, UseGuards } from '@nestjs/common';
import { LogService } from './log.service';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from 'src/auth/admin.gaurd';

@Controller('logs')
@UseGuards(AuthGuard('jwt'), AdminGuard)
export class LogController {
  constructor(private readonly logService: LogService) {}

  // @Post()
  // async create(@Body() createLogDto: CreateLogDto) {
  //   return this.logService.create(createLogDto);
  // }

  @Get()
  async findAll() {
    return this.logService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.logService.findOne(id);
  }

  // @Patch(':id')
  // async update(@Param('id') id: string, @Body() updateLogDto: UpdateLogDto) {
  //   return this.logService.update(id, updateLogDto);
  // }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.logService.remove(id);
  }
}

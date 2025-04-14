import { Module } from '@nestjs/common';
import { SensorService } from './sensor.service';
import { SensorController } from './sensor.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
@Module({
  imports: [PrismaModule],
  controllers: [SensorController],
  providers: [SensorService],
  exports: [SensorService],
})
export class SensorModule {}

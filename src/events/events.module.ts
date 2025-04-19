import { Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { PrismaModule } from '../prisma/prisma.module';
import { AlertModule } from '../alert/alert.module';
import { SensorModule } from '../sensor/sensor/sensor.module';
@Module({
  imports: [PrismaModule, AlertModule, SensorModule],
  providers: [EventsGateway],
  exports: [EventsGateway],
})
export class EventsModule {}

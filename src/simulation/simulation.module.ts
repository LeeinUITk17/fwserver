import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { WeatherApiSimulationService } from './WeatherApiSimulationService';
import { PrismaModule } from 'src/prisma/prisma.module';
import { MailModule } from 'src/mail/mail.module';
import { AlertModule } from 'src/alert/alert.module';
import { EventsModule } from 'src/events/events.module';
import { EventsGateway } from 'src/events/events.gateway';
@Module({
  imports: [
    HttpModule,
    ConfigModule,
    PrismaModule,
    MailModule,
    AlertModule,
    EventsModule,
  ],
  providers: [WeatherApiSimulationService, EventsGateway],
})
export class SimulationModule {}

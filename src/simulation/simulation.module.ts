import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { WeatherApiSimulationService } from './WeatherApiSimulationService';
import { PrismaModule } from 'src/prisma/prisma.module';
import { MailModule } from 'src/mail/mail.module';
import { AlertModule } from 'src/alert/alert.module';
@Module({
  imports: [HttpModule, ConfigModule, PrismaModule, MailModule, AlertModule],
  providers: [WeatherApiSimulationService],
})
export class SimulationModule {}

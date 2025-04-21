import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { WeatherApiSimulationService } from './WeatherApiSimulationService';
import { PrismaModule } from 'src/prisma/prisma.module';
import { MailModule } from 'src/mail/mail.module';
import { AlertModule } from 'src/alert/alert.module';
import { EventsModule } from 'src/events/events.module';
import { EventsGateway } from 'src/events/events.gateway';
import { RealFireDetectionService } from './fire-detection-simulation.service';
import { MlClientModule } from 'src/ml-client/ml-client.module';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { ImageProcessingModule } from 'src/image-processing/ImageProcessingModule';
@Module({
  imports: [
    HttpModule,
    ConfigModule,
    PrismaModule,
    MailModule,
    AlertModule,
    EventsModule,
    MlClientModule,
    CloudinaryModule,
    ImageProcessingModule,
  ],
  providers: [
    WeatherApiSimulationService,
    EventsGateway,
    RealFireDetectionService,
  ],
})
export class SimulationModule {}

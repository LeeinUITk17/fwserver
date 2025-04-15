import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { AlertModule } from './alert/alert.module';
import { CameraModule } from './camera/camera.module';
import { ZoneModule } from './zone/zone.module';
import { SensorModule } from './sensor/sensor/sensor.module';
import { LogModule } from './sensor/log/log.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { MailModule } from './mail/mail.module';

import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { SimulationModule } from './simulation/simulation.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    HttpModule,
    SimulationModule,
    AuthModule,
    PrismaModule,
    AlertModule,
    CameraModule,
    ZoneModule,
    SensorModule,
    LogModule,
    MailModule,
    CloudinaryModule,
  ],
  providers: [AppService],
})
export class AppModule {}

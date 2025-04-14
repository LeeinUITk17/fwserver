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

@Module({
  imports: [
    AuthModule,
    PrismaModule,
    AlertModule,
    CameraModule,
    ZoneModule,
    SensorModule,
    LogModule,
    CloudinaryModule,
  ],
  providers: [AppService],
})
export class AppModule {}

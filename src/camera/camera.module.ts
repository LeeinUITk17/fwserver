import { Module } from '@nestjs/common';
import { CameraService } from './camera.service';
import { CameraController } from './camera.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { ImageProcessingModule } from 'src/image-processing/ImageProcessingModule';

@Module({
  imports: [PrismaModule, CloudinaryModule, ImageProcessingModule],
  controllers: [CameraController],
  providers: [CameraService],
  exports: [CameraService],
})
export class CameraModule {}

import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import * as passport from 'passport';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Bật CORS nếu frontend gọi API từ domain khác
  app.enableCors({
    origin: 'http://localhost:3000', // Thay đổi tùy vào môi trường
    credentials: true,
  });

  // Middleware hỗ trợ cookies
  app.use(cookieParser());
  app.use(passport.initialize());
  // Lắng nghe trên cổng 3000
  const port = 8000;
  await app.listen(port, '0.0.0.0');
  Logger.log(`Server is running on http://localhost:${port}`);
}

bootstrap();

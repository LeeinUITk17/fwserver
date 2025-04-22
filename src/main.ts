import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import passport from 'passport';
import { Request, Response, NextFunction } from 'express';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Bật CORS nếu frontend gọi API từ domain khác
  app.enableCors({
    origin: 'http://localhost:3000', // Thay đổi tùy vào môi trường
    credentials: true,
  });

  // Middleware hỗ trợ cookies
  app.use(cookieParser());

  // --- ADD GLOBAL LOGGING MIDDLEWARE ---
  app.use((req: Request, res: Response, next: NextFunction) => {
    // console.log(`[Global Middleware] Request Path: ${req.path}`);
    // console.log('[Global Middleware] Parsed Cookies:', req.cookies); // Log parsed cookies
    // console.log('[Global Middleware] Raw Cookie Header:', req.headers.cookie); // Log raw header
    next(); // Continue to next middleware/handler
  });
  // --------------------------------------

  app.use(passport.initialize());
  // Lắng nghe trên cổng 3000
  const port = 8000;
  await app.listen(port, '0.0.0.0');
  Logger.log(`Server is running on http://localhost:${port}`);
}

bootstrap();

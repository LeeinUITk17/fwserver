import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MlClientService } from './ml-client.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    HttpModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        timeout: configService.get<number>('ML_SERVICE_TIMEOUT', 10000),
        maxRedirects: 5,
      }),
      inject: [ConfigService],
    }),
    ConfigModule,
  ],
  providers: [MlClientService],
  exports: [MlClientService],
})
export class MlClientModule {}

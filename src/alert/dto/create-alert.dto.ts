import { IsString, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { AlertStatus } from '@prisma/client';

export class CreateAlertDto {
  @IsString()
  message: string;

  @IsString()
  sensorId: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsEnum(AlertStatus)
  status?: AlertStatus;

  @IsOptional()
  @IsBoolean()
  viaEmail?: boolean;
}

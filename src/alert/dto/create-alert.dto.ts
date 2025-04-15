import { IsString, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { AlertStatus, AlertOrigin } from '@prisma/client';

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
  cameraId?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsEnum(AlertStatus)
  status?: AlertStatus;

  @IsOptional()
  @IsEnum(AlertOrigin)
  origin?: AlertOrigin;

  @IsOptional()
  @IsBoolean()
  viaEmail?: boolean;
}

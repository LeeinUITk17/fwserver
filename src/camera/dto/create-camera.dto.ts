import {
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsOptional,
  IsString,
  IsEnum,
  IsBoolean,
  IsUrl,
} from 'class-validator';
import { CameraStatus } from '@prisma/client';

export class CreateCameraDto {
  @IsString()
  name: string;

  @IsUrl()
  url: string;

  @IsString()
  zoneId: string;

  @IsOptional()
  @IsNumber()
  @IsLatitude()
  latitude?: number | null;

  @IsOptional()
  @IsNumber()
  @IsLongitude()
  longitude?: number | null;

  @IsOptional()
  @IsEnum(CameraStatus)
  status?: CameraStatus;

  @IsOptional()
  @IsBoolean()
  isDetecting?: boolean;

  @IsOptional()
  @IsString()
  lastSnapshotUrl?: string;
}

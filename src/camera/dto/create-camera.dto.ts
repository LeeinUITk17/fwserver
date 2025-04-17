import {
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateCameraDto {
  @IsString()
  name: string;

  @IsString()
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
}

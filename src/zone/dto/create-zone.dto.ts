import {
  IsString,
  IsOptional,
  IsNumber,
  IsLatitude,
  IsLongitude,
} from 'class-validator';

export class CreateZoneDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsNumber()
  @IsLatitude()
  latitude?: number | null;

  @IsOptional()
  @IsNumber()
  @IsLongitude()
  longitude?: number | null;
}

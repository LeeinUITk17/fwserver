import {
  IsString,
  IsOptional,
  IsNumber,
  IsLatitude,
  IsLongitude,
  Min,
  Max,
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
  @Min(-90)
  @Max(90)
  latitude?: number | null;

  @IsOptional()
  @IsNumber()
  @IsLongitude()
  @Min(-180)
  @Max(180)
  longitude?: number | null;
}

import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateLogDto {
  @IsString()
  sensorId: string;

  @IsOptional()
  @IsNumber()
  temperature?: number;

  @IsOptional()
  @IsNumber()
  humidity?: number;
}

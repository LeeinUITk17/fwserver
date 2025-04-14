import { IsString, IsNumber } from 'class-validator';

export class CreateSensorDto {
  @IsString()
  name: string;

  @IsString()
  type: string; // e.g., "temperature", "smoke", etc.

  @IsString()
  location: string;

  @IsNumber()
  threshold: number; // Max value before triggering an alert

  @IsNumber()
  sensitivity: number; // Sensitivity level

  @IsString()
  status: string; // e.g., "Active", "Inactive", "Error"

  @IsString()
  zoneId: string; // Foreign key to associate with a Zone
}

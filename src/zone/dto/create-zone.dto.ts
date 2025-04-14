import { IsString } from 'class-validator';

export class CreateZoneDto {
  @IsString()
  name: string;

  @IsString()
  location: string; // Could be coordinates or a description of the location
}

import { IsString } from 'class-validator';

export class CreateCameraDto {
  @IsString()
  name: string;

  @IsString()
  url: string;

  @IsString()
  zoneId: string;
}

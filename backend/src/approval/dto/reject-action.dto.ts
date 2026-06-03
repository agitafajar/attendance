import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class RejectActionDto {
  @ApiProperty({ example: 'Foto kegiatan tidak jelas.' })
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  notes: string;
}

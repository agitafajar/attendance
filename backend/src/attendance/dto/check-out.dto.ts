import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
} from 'class-validator';

export class CheckOutDto {
  @ApiPropertyOptional({ example: '2026-06-02' })
  @IsOptional()
  @IsDateString()
  attendanceDate?: string;

  @ApiProperty({ example: -6.2087634 })
  @IsLatitude()
  latitude: number;

  @ApiProperty({ example: 106.845599 })
  @IsLongitude()
  longitude: number;

  @ApiPropertyOptional({ example: '/uploads/attendance/check-out.jpg' })
  @IsOptional()
  @IsString()
  photoUrl?: string;
}

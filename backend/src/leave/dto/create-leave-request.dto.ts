import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LeaveType } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateLeaveRequestDto {
  @ApiProperty({ enum: LeaveType, example: LeaveType.SICK })
  @IsEnum(LeaveType)
  type: LeaveType;

  @ApiProperty({ example: '2026-06-10' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2026-06-12' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ example: 'Sakit dan membutuhkan istirahat.' })
  @IsString()
  @MinLength(5)
  @MaxLength(1000)
  reason: string;

  @ApiPropertyOptional({ example: '/uploads/leaves/surat-dokter.jpg' })
  @IsOptional()
  @IsUrl({ require_tld: false })
  attachmentUrl?: string;
}

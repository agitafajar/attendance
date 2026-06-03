import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApprovalStatus } from '@prisma/client';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MinLength,
} from 'class-validator';

export class CreateDailyActivityDto {
  @ApiPropertyOptional({
    description:
      'Optional. If omitted, system links attendance from activityDate when found.',
  })
  @IsOptional()
  @IsUUID()
  attendanceId?: string;

  @ApiProperty({ example: '2026-06-02' })
  @IsDateString()
  activityDate: string;

  @ApiProperty({ example: 'Patroli area lobby' })
  @IsString()
  @MinLength(3)
  title: string;

  @ApiProperty({
    example: 'Melakukan patroli area lobby dan pengecekan akses tamu.',
  })
  @IsString()
  @MinLength(5)
  description: string;

  @ApiPropertyOptional({ example: -6.2087634 })
  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @ApiPropertyOptional({ example: 106.845599 })
  @IsOptional()
  @IsLongitude()
  longitude?: number;

  @ApiPropertyOptional({
    enum: [ApprovalStatus.DRAFT, ApprovalStatus.SUBMITTED],
    default: ApprovalStatus.DRAFT,
  })
  @IsOptional()
  @IsEnum(ApprovalStatus)
  status?: ApprovalStatus;

  @ApiPropertyOptional({
    type: [String],
    example: ['/uploads/activities/photo-1.jpg'],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsUrl({ require_tld: false }, { each: true })
  photoUrls?: string[];
}

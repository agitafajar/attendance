import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
} from 'class-validator';

export class ReportQueryDto {
  @ApiPropertyOptional({ example: '2026-06-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-06-30' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  workLocationId?: string;
}

export class MonthlyAttendanceQueryDto {
  @ApiProperty({ example: '2026-06' })
  @IsString()
  @Matches(/^\d{4}-\d{2}$/, { message: 'month must use YYYY-MM format' })
  month: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  workLocationId?: string;
}

export class ExportReportQueryDto extends ReportQueryDto {
  @ApiProperty({
    enum: [
      'daily-attendance',
      'monthly-attendance',
      'activity',
      'client',
      'location',
    ],
  })
  @IsIn([
    'daily-attendance',
    'monthly-attendance',
    'activity',
    'client',
    'location',
  ])
  type:
    | 'daily-attendance'
    | 'monthly-attendance'
    | 'activity'
    | 'client'
    | 'location';

  @ApiPropertyOptional({
    example: '2026-06',
    description: 'Required for monthly-attendance export',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}$/, { message: 'month must use YYYY-MM format' })
  month?: string;
}

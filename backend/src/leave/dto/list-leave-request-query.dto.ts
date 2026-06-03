import { ApiPropertyOptional } from '@nestjs/swagger';
import { ApprovalStatus, LeaveType } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';

export class ListLeaveRequestQueryDto {
  @ApiPropertyOptional({ example: '2026-06-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-06-30' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ enum: LeaveType })
  @IsOptional()
  @IsEnum(LeaveType)
  type?: LeaveType;

  @ApiPropertyOptional({ enum: ApprovalStatus })
  @IsOptional()
  @IsEnum(ApprovalStatus)
  status?: ApprovalStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  employeeId?: string;
}

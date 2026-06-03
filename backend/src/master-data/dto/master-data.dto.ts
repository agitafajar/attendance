import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { RoleName } from '@prisma/client';
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
} from 'class-validator';

export class CreateClientDto {
  @ApiProperty({ example: 'CL-001' })
  @IsString()
  code: string;

  @ApiProperty({ example: 'PT Contoh Klien' })
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactPhone?: string;
}

export class UpdateClientDto extends PartialType(CreateClientDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateWorkLocationDto {
  @ApiProperty()
  @IsUUID()
  clientId: string;

  @ApiProperty({ example: 'Kantor Pusat Klien' })
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ example: -6.2087634 })
  @IsLatitude()
  latitude: number;

  @ApiProperty({ example: 106.845599 })
  @IsLongitude()
  longitude: number;

  @ApiPropertyOptional({ example: 150 })
  @IsOptional()
  @IsInt()
  @Min(1)
  geofenceRadiusMeter?: number;
}

export class UpdateWorkLocationDto extends PartialType(CreateWorkLocationDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateShiftDto {
  @ApiProperty({ example: 'SHIFT-PAGI' })
  @IsString()
  code: string;

  @ApiProperty({ example: 'Shift Pagi' })
  @IsString()
  name: string;

  @ApiProperty({ example: '08:00' })
  @IsString()
  startTime: string;

  @ApiProperty({ example: '17:00' })
  @IsString()
  endTime: string;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsInt()
  @Min(0)
  gracePeriodMinutes?: number;
}

export class UpdateShiftDto extends PartialType(CreateShiftDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateUserProfileDto {
  @ApiProperty({ example: 'employee@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'UseAStrongPassword123!' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'Nama Karyawan' })
  @IsString()
  fullName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;
}

export class CreateSupervisorDto extends CreateUserProfileDto {
  @ApiProperty({ example: 'SPV-002' })
  @IsString()
  supervisorNumber: string;
}

export class UpdateSupervisorDto {
  @ApiPropertyOptional({ example: 'SPV-002' })
  @IsOptional()
  @IsString()
  supervisorNumber?: string;

  @ApiPropertyOptional({ example: 'supervisor@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'Nama Supervisor' })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateEmployeeDto extends CreateUserProfileDto {
  @ApiProperty({ example: 'EMP-002' })
  @IsString()
  employeeNumber: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  supervisorId?: string;

  @ApiPropertyOptional({ example: 'Security Officer' })
  @IsOptional()
  @IsString()
  position?: string;

  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsOptional()
  @IsDateString()
  joinDate?: string;

  @ApiPropertyOptional({ example: 'CONTRACT' })
  @IsOptional()
  @IsString()
  employmentStatus?: string;
}

export class UpdateEmployeeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  supervisorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  position?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  employmentStatus?: string;
}

export class CreateAssignmentDto {
  @ApiProperty()
  @IsUUID()
  employeeId: string;

  @ApiProperty()
  @IsUUID()
  clientId: string;

  @ApiProperty()
  @IsUUID()
  workLocationId: string;

  @ApiProperty()
  @IsUUID()
  shiftId: string;

  @ApiProperty({ example: '2026-01-01' })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class UpdateAssignmentDto extends PartialType(CreateAssignmentDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ListUserQueryDto {
  @ApiPropertyOptional({ enum: RoleName })
  @IsOptional()
  @IsEnum(RoleName)
  role?: RoleName;
}

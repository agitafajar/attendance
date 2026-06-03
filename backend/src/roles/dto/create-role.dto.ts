import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoleName } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ enum: RoleName, example: RoleName.ADMIN })
  @IsEnum(RoleName)
  name: RoleName;

  @ApiPropertyOptional({ example: 'Role description' })
  @IsOptional()
  @IsString()
  description?: string;
}

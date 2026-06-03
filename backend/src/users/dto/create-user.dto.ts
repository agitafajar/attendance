import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoleName } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'user@alihdaya.test' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'UseAStrongPassword123!', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'Nama Pengguna' })
  @IsString()
  fullName: string;

  @ApiPropertyOptional({ example: '081100000001' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ enum: RoleName, example: RoleName.EMPLOYEE })
  @IsEnum(RoleName)
  role: RoleName;
}

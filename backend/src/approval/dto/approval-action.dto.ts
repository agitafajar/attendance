import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ApprovalActionDto {
  @ApiPropertyOptional({ example: 'Data sudah sesuai.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

export class UploadQueryDto {
  @ApiPropertyOptional({
    enum: ['attendance', 'activity', 'leave', 'general'],
    default: 'general',
  })
  @IsOptional()
  @IsIn(['attendance', 'activity', 'leave', 'general'])
  type?: 'attendance' | 'activity' | 'leave' | 'general';
}

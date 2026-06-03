import { Module } from '@nestjs/common';
import { DailyActivityController } from './daily-activity.controller';
import { DailyActivityRepository } from './daily-activity.repository';
import { DailyActivityService } from './daily-activity.service';

@Module({
  controllers: [DailyActivityController],
  providers: [DailyActivityService, DailyActivityRepository],
  exports: [DailyActivityService],
})
export class DailyActivityModule {}

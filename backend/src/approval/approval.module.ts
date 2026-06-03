import { Module } from '@nestjs/common';
import { ApprovalController } from './approval.controller';
import { ApprovalRepository } from './approval.repository';
import { ApprovalService } from './approval.service';

@Module({
  controllers: [ApprovalController],
  providers: [ApprovalService, ApprovalRepository],
  exports: [ApprovalService],
})
export class ApprovalModule {}

import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RoleName } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { ApprovalService } from './approval.service';
import { ApprovalActionDto } from './dto/approval-action.dto';
import { RejectActionDto } from './dto/reject-action.dto';

@ApiTags('Approvals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.ADMIN, RoleName.SUPERVISOR)
@Controller('approvals')
export class ApprovalController {
  constructor(private readonly approvalService: ApprovalService) {}

  @Get('attendances/pending')
  listPendingAttendances(@CurrentUser() user: JwtUser) {
    return this.approvalService.listPendingAttendances(user);
  }

  @Post('attendances/:id/approve')
  approveAttendance(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() dto: ApprovalActionDto,
  ) {
    return this.approvalService.approveAttendance(user, id, dto.notes);
  }

  @Post('attendances/:id/reject')
  rejectAttendance(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() dto: RejectActionDto,
  ) {
    return this.approvalService.rejectAttendance(user, id, dto.notes);
  }

  @Get('daily-activities/pending')
  listPendingDailyActivities(@CurrentUser() user: JwtUser) {
    return this.approvalService.listPendingDailyActivities(user);
  }

  @Post('daily-activities/:id/approve')
  approveDailyActivity(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() dto: ApprovalActionDto,
  ) {
    return this.approvalService.approveDailyActivity(user, id, dto.notes);
  }

  @Post('daily-activities/:id/reject')
  rejectDailyActivity(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() dto: RejectActionDto,
  ) {
    return this.approvalService.rejectDailyActivity(user, id, dto.notes);
  }

  @Get('leave-requests/pending')
  listPendingLeaveRequests(@CurrentUser() user: JwtUser) {
    return this.approvalService.listPendingLeaveRequests(user);
  }

  @Post('leave-requests/:id/approve')
  approveLeaveRequest(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() dto: ApprovalActionDto,
  ) {
    return this.approvalService.approveLeaveRequest(user, id, dto.notes);
  }

  @Post('leave-requests/:id/reject')
  rejectLeaveRequest(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() dto: RejectActionDto,
  ) {
    return this.approvalService.rejectLeaveRequest(user, id, dto.notes);
  }
}

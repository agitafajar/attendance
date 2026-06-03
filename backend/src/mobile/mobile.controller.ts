import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RoleName } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import {
  MobileActivityHistoryQueryDto,
  MobileAttendanceHistoryQueryDto,
  MobileLeaveHistoryQueryDto,
} from './dto/mobile-history-query.dto';
import { MobileService } from './mobile.service';

@ApiTags('Mobile')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('mobile')
export class MobileController {
  constructor(private readonly mobileService: MobileService) {}

  @Get('me')
  me(@CurrentUser() user: JwtUser) {
    return this.mobileService.me(user);
  }

  @Get('today')
  @Roles(RoleName.EMPLOYEE)
  today(@CurrentUser() user: JwtUser) {
    return this.mobileService.today(user);
  }

  @Get('assignments/active')
  @Roles(RoleName.EMPLOYEE)
  activeAssignments(@CurrentUser() user: JwtUser) {
    return this.mobileService.activeAssignments(user);
  }

  @Get('attendances')
  @Roles(RoleName.EMPLOYEE)
  attendanceHistory(
    @CurrentUser() user: JwtUser,
    @Query() query: MobileAttendanceHistoryQueryDto,
  ) {
    return this.mobileService.attendanceHistory(user, query);
  }

  @Get('activities')
  @Roles(RoleName.EMPLOYEE)
  activityHistory(
    @CurrentUser() user: JwtUser,
    @Query() query: MobileActivityHistoryQueryDto,
  ) {
    return this.mobileService.activityHistory(user, query);
  }

  @Get('leave-requests')
  @Roles(RoleName.EMPLOYEE)
  leaveHistory(
    @CurrentUser() user: JwtUser,
    @Query() query: MobileLeaveHistoryQueryDto,
  ) {
    return this.mobileService.leaveHistory(user, query);
  }
}

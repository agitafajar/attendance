import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RoleName } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('admin')
  @Roles(RoleName.ADMIN)
  getAdminDashboard() {
    return this.dashboardService.getAdminDashboard();
  }

  @Get('supervisor')
  @Roles(RoleName.SUPERVISOR)
  getSupervisorDashboard(@CurrentUser() user: JwtUser) {
    return this.dashboardService.getSupervisorDashboard(user);
  }

  @Get('employee')
  @Roles(RoleName.EMPLOYEE)
  getEmployeeDashboard(@CurrentUser() user: JwtUser) {
    return this.dashboardService.getEmployeeDashboard(user);
  }
}

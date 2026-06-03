import {
  Controller,
  Get,
  Header,
  Query,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RoleName } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import {
  ExportReportQueryDto,
  MonthlyAttendanceQueryDto,
  ReportQueryDto,
} from './dto/report-query.dto';
import { ReportService } from './report.service';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.ADMIN, RoleName.SUPERVISOR)
@Controller('reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('daily-attendance')
  dailyAttendance(
    @CurrentUser() user: JwtUser,
    @Query() query: ReportQueryDto,
  ) {
    return this.reportService.dailyAttendance(user, query);
  }

  @Get('monthly-attendance')
  monthlyAttendance(
    @CurrentUser() user: JwtUser,
    @Query() query: MonthlyAttendanceQueryDto,
  ) {
    return this.reportService.monthlyAttendance(user, query);
  }

  @Get('activities')
  activityReport(@CurrentUser() user: JwtUser, @Query() query: ReportQueryDto) {
    return this.reportService.activityReport(user, query);
  }

  @Get('clients')
  clientReport(@CurrentUser() user: JwtUser, @Query() query: ReportQueryDto) {
    return this.reportService.clientReport(user, query);
  }

  @Get('locations')
  locationReport(@CurrentUser() user: JwtUser, @Query() query: ReportQueryDto) {
    return this.reportService.locationReport(user, query);
  }

  @Get('export/excel')
  @Header(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
  async exportExcel(
    @CurrentUser() user: JwtUser,
    @Query() query: ExportReportQueryDto,
  ) {
    const buffer = await this.reportService.exportExcel(user, query);
    return new StreamableFile(buffer, {
      disposition: `attachment; filename="${query.type}-report.xlsx"`,
    });
  }

  @Get('export/pdf')
  @Header('Content-Type', 'application/pdf')
  async exportPdf(
    @CurrentUser() user: JwtUser,
    @Query() query: ExportReportQueryDto,
  ) {
    const buffer = await this.reportService.exportPdf(user, query);
    return new StreamableFile(buffer, {
      disposition: `attachment; filename="${query.type}-report.pdf"`,
    });
  }
}

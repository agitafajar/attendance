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
  dailyAttendance(@Query() query: ReportQueryDto) {
    return this.reportService.dailyAttendance(query);
  }

  @Get('monthly-attendance')
  monthlyAttendance(@Query() query: MonthlyAttendanceQueryDto) {
    return this.reportService.monthlyAttendance(query);
  }

  @Get('activities')
  activityReport(@Query() query: ReportQueryDto) {
    return this.reportService.activityReport(query);
  }

  @Get('clients')
  clientReport(@Query() query: ReportQueryDto) {
    return this.reportService.clientReport(query);
  }

  @Get('locations')
  locationReport(@Query() query: ReportQueryDto) {
    return this.reportService.locationReport(query);
  }

  @Get('export/excel')
  @Header(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
  async exportExcel(@Query() query: ExportReportQueryDto) {
    const buffer = await this.reportService.exportExcel(query);
    return new StreamableFile(buffer, {
      disposition: `attachment; filename="${query.type}-report.xlsx"`,
    });
  }

  @Get('export/pdf')
  @Header('Content-Type', 'application/pdf')
  async exportPdf(@Query() query: ExportReportQueryDto) {
    const buffer = await this.reportService.exportPdf(query);
    return new StreamableFile(buffer, {
      disposition: `attachment; filename="${query.type}-report.pdf"`,
    });
  }
}

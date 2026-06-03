import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { RoleName } from '@prisma/client';
import { Workbook } from 'exceljs';
import PDFDocument from 'pdfkit';
import type { JwtUser } from '../common/decorators/current-user.decorator';
import {
  formatDateOnly,
  getJakartaMonthRange,
  toJakartaDateOnly,
} from '../common/date/jakarta-date';
import { PrismaService } from '../prisma/prisma.service';
import {
  ExportReportQueryDto,
  MonthlyAttendanceQueryDto,
  ReportQueryDto,
} from './dto/report-query.dto';

type ReportRow = Record<string, string | number | null | undefined>;
type ReportScope = {
  supervisorId?: string;
};

@Injectable()
export class ReportService {
  constructor(private readonly prisma: PrismaService) {}

  async dailyAttendance(user: JwtUser, query: ReportQueryDto) {
    const scope = await this.resolveReportScope(user);

    return this.prisma.attendance.findMany({
      where: this.attendanceWhere(query, scope),
      include: this.attendanceInclude(),
      orderBy: [{ attendanceDate: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async monthlyAttendance(user: JwtUser, query: MonthlyAttendanceQueryDto) {
    if (!/^\d{4}-\d{2}$/.test(query.month)) {
      throw new BadRequestException('month must use YYYY-MM format');
    }

    const scope = await this.resolveReportScope(user);
    const { startDate, endDate } = getJakartaMonthRange(query.month);

    const attendances = await this.prisma.attendance.findMany({
      where: this.attendanceWhere(
        {
          startDate: formatDateOnly(startDate),
          endDate: formatDateOnly(endDate),
          employeeId: query.employeeId,
          clientId: query.clientId,
          workLocationId: query.workLocationId,
        },
        scope,
      ),
      include: this.attendanceInclude(),
      orderBy: [
        { employee: { employeeNumber: 'asc' } },
        { attendanceDate: 'asc' },
      ],
    });

    const summaries = new Map<string, ReportRow>();

    for (const attendance of attendances) {
      const key = attendance.employeeId;
      const current = summaries.get(key) ?? {
        employeeNumber: attendance.employee.employeeNumber,
        employeeName: attendance.employee.user.fullName,
        present: 0,
        late: 0,
        approved: 0,
        rejected: 0,
        totalWorkMinutes: 0,
      };

      current.present = Number(current.present) + 1;
      current.late =
        Number(current.late) +
        (attendance.lateMinutes && attendance.lateMinutes > 0 ? 1 : 0);
      current.approved =
        Number(current.approved) + (attendance.status === 'APPROVED' ? 1 : 0);
      current.rejected =
        Number(current.rejected) + (attendance.status === 'REJECTED' ? 1 : 0);
      current.totalWorkMinutes =
        Number(current.totalWorkMinutes) + (attendance.workMinutes ?? 0);
      summaries.set(key, current);
    }

    return {
      month: query.month,
      rows: Array.from(summaries.values()),
      details: attendances,
    };
  }

  async activityReport(user: JwtUser, query: ReportQueryDto) {
    const scope = await this.resolveReportScope(user);

    return this.prisma.dailyActivity.findMany({
      where: {
        deletedAt: null,
        employeeId: query.employeeId,
        activityDate: this.dateRange(query),
        employee: {
          supervisorId: scope.supervisorId,
          assignments: {
            some: {
              clientId: query.clientId,
              workLocationId: query.workLocationId,
              deletedAt: null,
            },
          },
        },
      },
      include: {
        employee: { include: { user: true } },
        attendance: true,
        photos: { where: { deletedAt: null } },
        approvedBy: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: [{ activityDate: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async clientReport(user: JwtUser, query: ReportQueryDto) {
    const scope = await this.resolveReportScope(user);

    return this.prisma.client.findMany({
      where: {
        id: query.clientId,
        deletedAt: null,
        assignments: scope.supervisorId
          ? {
              some: {
                deletedAt: null,
                workLocationId: query.workLocationId,
                employeeId: query.employeeId,
                employee: { supervisorId: scope.supervisorId },
              },
            }
          : undefined,
      },
      include: {
        locations: { where: { deletedAt: null } },
        assignments: {
          where: {
            deletedAt: null,
            workLocationId: query.workLocationId,
            employeeId: query.employeeId,
            employee: scope.supervisorId
              ? { supervisorId: scope.supervisorId }
              : undefined,
          },
          include: {
            employee: { include: { user: true } },
            workLocation: true,
            shift: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async locationReport(user: JwtUser, query: ReportQueryDto) {
    const scope = await this.resolveReportScope(user);

    return this.prisma.workLocation.findMany({
      where: {
        id: query.workLocationId,
        clientId: query.clientId,
        deletedAt: null,
        assignments: scope.supervisorId
          ? {
              some: {
                deletedAt: null,
                employeeId: query.employeeId,
                employee: { supervisorId: scope.supervisorId },
              },
            }
          : undefined,
      },
      include: {
        client: true,
        assignments: {
          where: {
            deletedAt: null,
            employeeId: query.employeeId,
            employee: scope.supervisorId
              ? { supervisorId: scope.supervisorId }
              : undefined,
          },
          include: {
            employee: { include: { user: true } },
            shift: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async exportExcel(user: JwtUser, query: ExportReportQueryDto) {
    const rows = await this.resolveExportRows(user, query);
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('Report');

    const columns = rows.length ? Object.keys(rows[0]) : ['message'];
    worksheet.columns = columns.map((key) => ({
      header: key,
      key,
      width: Math.max(16, key.length + 4),
    }));

    if (rows.length) {
      worksheet.addRows(rows);
    } else {
      worksheet.addRow({ message: 'No data' });
    }

    worksheet.getRow(1).font = { bold: true };
    const buffer = await workbook.xlsx.writeBuffer();

    return Buffer.from(buffer);
  }

  async exportPdf(user: JwtUser, query: ExportReportQueryDto) {
    const rows = await this.resolveExportRows(user, query);

    return new Promise<Buffer>((resolve) => {
      const doc = new PDFDocument({ margin: 32, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      doc.fontSize(16).text(`Alih Daya ${this.toTitle(query.type)} Report`, {
        align: 'left',
      });
      doc.moveDown();
      doc.fontSize(9).text(`Generated at: ${new Date().toISOString()}`);
      doc.moveDown();

      if (!rows.length) {
        doc.text('No data');
        doc.end();
        return;
      }

      rows.slice(0, 200).forEach((row, index) => {
        doc.fontSize(10).text(`${index + 1}. ${this.stringifyRow(row)}`);
        doc.moveDown(0.4);
      });

      if (rows.length > 200) {
        doc.moveDown();
        doc.text(
          `Showing first 200 rows of ${rows.length}. Use Excel export for full data.`,
        );
      }

      doc.end();
    });
  }

  private async resolveExportRows(
    user: JwtUser,
    query: ExportReportQueryDto,
  ): Promise<ReportRow[]> {
    if (query.type === 'daily-attendance') {
      return this.attendanceRows(await this.dailyAttendance(user, query));
    }

    if (query.type === 'monthly-attendance') {
      if (!query.month) {
        throw new BadRequestException(
          'month is required for monthly-attendance export',
        );
      }

      const monthly = await this.monthlyAttendance(user, {
        month: query.month,
        employeeId: query.employeeId,
        clientId: query.clientId,
        workLocationId: query.workLocationId,
      });
      return monthly.rows;
    }

    if (query.type === 'activity') {
      return this.activityRows(await this.activityReport(user, query));
    }

    if (query.type === 'client') {
      return this.clientRows(await this.clientReport(user, query));
    }

    return this.locationRows(await this.locationReport(user, query));
  }

  private attendanceWhere(query: ReportQueryDto, scope: ReportScope) {
    return {
      deletedAt: null,
      employeeId: query.employeeId,
      attendanceDate: this.dateRange(query),
      assignment: {
        clientId: query.clientId,
        workLocationId: query.workLocationId,
      },
      employee: {
        supervisorId: scope.supervisorId,
      },
    };
  }

  private attendanceInclude() {
    return {
      employee: { include: { user: true } },
      assignment: {
        include: {
          client: true,
          workLocation: true,
          shift: true,
        },
      },
      approvedBy: { select: { id: true, fullName: true, email: true } },
    };
  }

  private attendanceRows(
    items: Awaited<ReturnType<ReportService['dailyAttendance']>>,
  ) {
    return items.map((item) => ({
      date: formatDateOnly(item.attendanceDate),
      employeeNumber: item.employee.employeeNumber,
      employeeName: item.employee.user.fullName,
      client: item.assignment.client.name,
      location: item.assignment.workLocation.name,
      status: item.status,
      checkIn: item.checkInTime?.toISOString() ?? '',
      checkOut: item.checkOutTime?.toISOString() ?? '',
      lateMinutes: item.lateMinutes ?? 0,
      workMinutes: item.workMinutes ?? 0,
    }));
  }

  private activityRows(
    items: Awaited<ReturnType<ReportService['activityReport']>>,
  ) {
    return items.map((item) => ({
      date: formatDateOnly(item.activityDate),
      employeeNumber: item.employee.employeeNumber,
      employeeName: item.employee.user.fullName,
      title: item.title,
      status: item.status,
      photoCount: item.photos.length,
      approvedBy: item.approvedBy?.fullName ?? '',
    }));
  }

  private clientRows(
    items: Awaited<ReturnType<ReportService['clientReport']>>,
  ) {
    return items.map((item) => ({
      code: item.code,
      name: item.name,
      locations: item.locations.length,
      assignments: item.assignments.length,
      active: item.isActive ? 'yes' : 'no',
    }));
  }

  private locationRows(
    items: Awaited<ReturnType<ReportService['locationReport']>>,
  ) {
    return items.map((item) => ({
      client: item.client.name,
      location: item.name,
      radiusMeter: item.geofenceRadiusMeter,
      assignments: item.assignments.length,
      active: item.isActive ? 'yes' : 'no',
    }));
  }

  private dateRange(query: ReportQueryDto) {
    const startDate = query.startDate
      ? toJakartaDateOnly(query.startDate)
      : undefined;
    const endDate = query.endDate
      ? toJakartaDateOnly(query.endDate)
      : undefined;

    return startDate || endDate
      ? {
          gte: startDate,
          lte: endDate,
        }
      : undefined;
  }

  private stringifyRow(row: ReportRow) {
    return Object.entries(row)
      .map(([key, value]) => `${key}: ${value ?? ''}`)
      .join(' | ');
  }

  private toTitle(value: string) {
    return value
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private async resolveReportScope(user: JwtUser): Promise<ReportScope> {
    const role = user.role as RoleName;

    if (role === RoleName.ADMIN) {
      return {};
    }

    if (role !== RoleName.SUPERVISOR) {
      throw new ForbiddenException(
        'Only admin or supervisor can access reports',
      );
    }

    const supervisor = await this.prisma.supervisor.findFirst({
      where: { userId: user.sub, deletedAt: null },
      select: { id: true },
    });

    if (!supervisor) {
      throw new ForbiddenException('Supervisor profile not found');
    }

    return { supervisorId: supervisor.id };
  }
}

import { ForbiddenException, Injectable } from '@nestjs/common';
import { ApprovalStatus, AttendanceStatus } from '@prisma/client';
import type { JwtUser } from '../common/decorators/current-user.decorator';
import { toJakartaDateOnly } from '../common/date/jakarta-date';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getAdminDashboard() {
    const today = toJakartaDateOnly(new Date());

    const [
      totalEmployees,
      presentToday,
      lateToday,
      leaveToday,
      submittedActivities,
      approvedActivities,
      rejectedActivities,
      totalActivitiesToday,
      attendedEmployeeIds,
      leaveEmployeeIds,
    ] = await Promise.all([
      this.prisma.employee.count({ where: { deletedAt: null } }),
      this.prisma.attendance.count({
        where: {
          deletedAt: null,
          attendanceDate: today,
          status: {
            in: [
              AttendanceStatus.PRESENT,
              AttendanceStatus.LATE,
              AttendanceStatus.APPROVED,
            ],
          },
        },
      }),
      this.prisma.attendance.count({
        where: {
          deletedAt: null,
          attendanceDate: today,
          status: AttendanceStatus.LATE,
        },
      }),
      this.prisma.leaveRequest.count({
        where: {
          deletedAt: null,
          status: ApprovalStatus.APPROVED,
          startDate: { lte: today },
          endDate: { gte: today },
        },
      }),
      this.prisma.dailyActivity.count({
        where: {
          deletedAt: null,
          activityDate: today,
          status: ApprovalStatus.SUBMITTED,
        },
      }),
      this.prisma.dailyActivity.count({
        where: {
          deletedAt: null,
          activityDate: today,
          status: ApprovalStatus.APPROVED,
        },
      }),
      this.prisma.dailyActivity.count({
        where: {
          deletedAt: null,
          activityDate: today,
          status: ApprovalStatus.REJECTED,
        },
      }),
      this.prisma.dailyActivity.count({
        where: { deletedAt: null, activityDate: today },
      }),
      this.prisma.attendance.findMany({
        where: { deletedAt: null, attendanceDate: today },
        select: { employeeId: true },
      }),
      this.prisma.leaveRequest.findMany({
        where: {
          deletedAt: null,
          status: ApprovalStatus.APPROVED,
          startDate: { lte: today },
          endDate: { gte: today },
        },
        select: { employeeId: true },
      }),
    ]);

    const absent = await this.countAbsentEmployees(
      today,
      attendedEmployeeIds.map((item) => item.employeeId),
      leaveEmployeeIds.map((item) => item.employeeId),
    );

    return {
      date: today,
      totalEmployees,
      presentToday,
      late: lateToday,
      absent,
      leave: leaveToday,
      activityStatistics: {
        totalToday: totalActivitiesToday,
        submitted: submittedActivities,
        approved: approvedActivities,
        rejected: rejectedActivities,
      },
    };
  }

  async getSupervisorDashboard(user: JwtUser) {
    const supervisor = await this.prisma.supervisor.findFirst({
      where: { userId: user.sub, deletedAt: null },
    });

    if (!supervisor) {
      throw new ForbiddenException('Supervisor profile not found');
    }

    const [
      totalEmployees,
      pendingAttendance,
      pendingActivities,
      pendingLeaves,
    ] = await Promise.all([
      this.prisma.employee.count({
        where: { deletedAt: null, supervisorId: supervisor.id },
      }),
      this.prisma.attendance.count({
        where: {
          deletedAt: null,
          employee: { supervisorId: supervisor.id },
          approvedAt: null,
          status: {
            in: [
              AttendanceStatus.PRESENT,
              AttendanceStatus.LATE,
              AttendanceStatus.PENDING_APPROVAL,
            ],
          },
        },
      }),
      this.prisma.dailyActivity.count({
        where: {
          deletedAt: null,
          employee: { supervisorId: supervisor.id },
          status: ApprovalStatus.SUBMITTED,
        },
      }),
      this.prisma.leaveRequest.count({
        where: {
          deletedAt: null,
          employee: { supervisorId: supervisor.id },
          status: ApprovalStatus.SUBMITTED,
        },
      }),
    ]);

    return {
      totalEmployees,
      pendingAttendance,
      pendingActivities,
      pendingLeaves,
    };
  }

  async getEmployeeDashboard(user: JwtUser) {
    const employee = await this.prisma.employee.findFirst({
      where: { userId: user.sub, deletedAt: null },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!employee) {
      throw new ForbiddenException('Employee profile not found');
    }

    const today = toJakartaDateOnly(new Date());
    const [myAttendance, myActivities, myLeaveRequests] = await Promise.all([
      this.prisma.attendance.findUnique({
        where: {
          employeeId_attendanceDate: {
            employeeId: employee.id,
            attendanceDate: today,
          },
        },
      }),
      this.prisma.dailyActivity.findMany({
        where: {
          deletedAt: null,
          employeeId: employee.id,
          activityDate: today,
        },
        include: { photos: { where: { deletedAt: null } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.leaveRequest.findMany({
        where: { deletedAt: null, employeeId: employee.id },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    return {
      employee,
      date: today,
      myAttendance,
      myActivities,
      myLeaveRequests,
    };
  }

  private async countAbsentEmployees(
    today: Date,
    attendedEmployeeIds: string[],
    leaveEmployeeIds: string[],
  ) {
    const excludedEmployeeIds = [
      ...new Set([...attendedEmployeeIds, ...leaveEmployeeIds]),
    ];

    return this.prisma.employee.count({
      where: {
        deletedAt: null,
        id: excludedEmployeeIds.length
          ? { notIn: excludedEmployeeIds }
          : undefined,
        assignments: {
          some: {
            deletedAt: null,
            isActive: true,
            startDate: { lte: today },
            OR: [{ endDate: null }, { endDate: { gte: today } }],
          },
        },
      },
    });
  }
}

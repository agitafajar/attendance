import { Injectable } from '@nestjs/common';
import {
  ApprovalAction,
  ApprovalStatus,
  ApprovalTargetType,
  AttendanceStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ApprovalRepository {
  constructor(private readonly prisma: PrismaService) {}

  findSupervisorByUserId(userId: string) {
    return this.prisma.supervisor.findFirst({
      where: { userId, deletedAt: null },
    });
  }

  findEmployeeById(id: string) {
    return this.prisma.employee.findFirst({
      where: { id, deletedAt: null },
    });
  }

  findAttendanceById(id: string) {
    return this.prisma.attendance.findFirst({
      where: { id, deletedAt: null },
      include: this.attendanceInclude(),
    });
  }

  findDailyActivityById(id: string) {
    return this.prisma.dailyActivity.findFirst({
      where: { id, deletedAt: null },
      include: this.dailyActivityInclude(),
    });
  }

  findLeaveRequestById(id: string) {
    return this.prisma.leaveRequest.findFirst({
      where: { id, deletedAt: null },
      include: this.leaveRequestInclude(),
    });
  }

  approveAttendance(id: string, approverId: string, notes?: string) {
    return this.prisma.$transaction(async (tx) => {
      const attendance = await tx.attendance.update({
        where: { id },
        data: {
          status: AttendanceStatus.APPROVED,
          approvedBy: { connect: { id: approverId } },
          approvedAt: new Date(),
          rejectionNote: null,
        },
        include: this.attendanceInclude(),
      });

      await tx.approvalLog.create({
        data: {
          approver: { connect: { id: approverId } },
          attendance: { connect: { id } },
          targetType: ApprovalTargetType.ATTENDANCE,
          action: ApprovalAction.APPROVED,
          notes,
        },
      });

      return attendance;
    });
  }

  rejectAttendance(id: string, approverId: string, notes: string) {
    return this.prisma.$transaction(async (tx) => {
      const attendance = await tx.attendance.update({
        where: { id },
        data: {
          status: AttendanceStatus.REJECTED,
          approvedBy: { connect: { id: approverId } },
          approvedAt: new Date(),
          rejectionNote: notes,
        },
        include: this.attendanceInclude(),
      });

      await tx.approvalLog.create({
        data: {
          approver: { connect: { id: approverId } },
          attendance: { connect: { id } },
          targetType: ApprovalTargetType.ATTENDANCE,
          action: ApprovalAction.REJECTED,
          notes,
        },
      });

      return attendance;
    });
  }

  approveDailyActivity(id: string, approverId: string, notes?: string) {
    return this.prisma.$transaction(async (tx) => {
      const activity = await tx.dailyActivity.update({
        where: { id },
        data: {
          status: ApprovalStatus.APPROVED,
          approvedBy: { connect: { id: approverId } },
          approvedAt: new Date(),
          rejectionNote: null,
        },
        include: this.dailyActivityInclude(),
      });

      await tx.approvalLog.create({
        data: {
          approver: { connect: { id: approverId } },
          dailyActivity: { connect: { id } },
          targetType: ApprovalTargetType.DAILY_ACTIVITY,
          action: ApprovalAction.APPROVED,
          notes,
        },
      });

      return activity;
    });
  }

  rejectDailyActivity(id: string, approverId: string, notes: string) {
    return this.prisma.$transaction(async (tx) => {
      const activity = await tx.dailyActivity.update({
        where: { id },
        data: {
          status: ApprovalStatus.REJECTED,
          approvedBy: { connect: { id: approverId } },
          approvedAt: new Date(),
          rejectionNote: notes,
        },
        include: this.dailyActivityInclude(),
      });

      await tx.approvalLog.create({
        data: {
          approver: { connect: { id: approverId } },
          dailyActivity: { connect: { id } },
          targetType: ApprovalTargetType.DAILY_ACTIVITY,
          action: ApprovalAction.REJECTED,
          notes,
        },
      });

      return activity;
    });
  }

  approveLeaveRequest(id: string, approverId: string, notes?: string) {
    return this.prisma.$transaction(async (tx) => {
      const leaveRequest = await tx.leaveRequest.update({
        where: { id },
        data: {
          status: ApprovalStatus.APPROVED,
          approvedBy: { connect: { id: approverId } },
          approvedAt: new Date(),
          rejectionNote: null,
        },
        include: this.leaveRequestInclude(),
      });

      await tx.approvalLog.create({
        data: {
          approver: { connect: { id: approverId } },
          leaveRequest: { connect: { id } },
          targetType: ApprovalTargetType.LEAVE_REQUEST,
          action: ApprovalAction.APPROVED,
          notes,
        },
      });

      return leaveRequest;
    });
  }

  rejectLeaveRequest(id: string, approverId: string, notes: string) {
    return this.prisma.$transaction(async (tx) => {
      const leaveRequest = await tx.leaveRequest.update({
        where: { id },
        data: {
          status: ApprovalStatus.REJECTED,
          approvedBy: { connect: { id: approverId } },
          approvedAt: new Date(),
          rejectionNote: notes,
        },
        include: this.leaveRequestInclude(),
      });

      await tx.approvalLog.create({
        data: {
          approver: { connect: { id: approverId } },
          leaveRequest: { connect: { id } },
          targetType: ApprovalTargetType.LEAVE_REQUEST,
          action: ApprovalAction.REJECTED,
          notes,
        },
      });

      return leaveRequest;
    });
  }

  listPendingAttendances(where: Prisma.AttendanceWhereInput) {
    return this.prisma.attendance.findMany({
      where,
      include: this.attendanceInclude(),
      orderBy: [{ attendanceDate: 'desc' }, { createdAt: 'desc' }],
    });
  }

  listPendingDailyActivities(where: Prisma.DailyActivityWhereInput) {
    return this.prisma.dailyActivity.findMany({
      where,
      include: this.dailyActivityInclude(),
      orderBy: [{ activityDate: 'desc' }, { createdAt: 'desc' }],
    });
  }

  listPendingLeaveRequests(where: Prisma.LeaveRequestWhereInput) {
    return this.prisma.leaveRequest.findMany({
      where,
      include: this.leaveRequestInclude(),
      orderBy: [{ startDate: 'desc' }, { createdAt: 'desc' }],
    });
  }

  private attendanceInclude() {
    return {
      employee: {
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
            },
          },
        },
      },
      assignment: {
        include: {
          client: true,
          workLocation: true,
          shift: true,
        },
      },
      approvedBy: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    };
  }

  private dailyActivityInclude() {
    return {
      employee: {
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
            },
          },
        },
      },
      attendance: true,
      photos: {
        where: { deletedAt: null },
        orderBy: { createdAt: 'asc' as const },
      },
      approvedBy: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    };
  }

  private leaveRequestInclude() {
    return {
      employee: {
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
            },
          },
        },
      },
      approvedBy: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    };
  }
}

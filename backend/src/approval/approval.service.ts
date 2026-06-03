import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ApprovalStatus, AttendanceStatus, RoleName } from '@prisma/client';
import type { JwtUser } from '../common/decorators/current-user.decorator';
import { ApprovalRepository } from './approval.repository';

@Injectable()
export class ApprovalService {
  constructor(private readonly approvalRepository: ApprovalRepository) {}

  async approveAttendance(user: JwtUser, id: string, notes?: string) {
    const attendance = await this.approvalRepository.findAttendanceById(id);

    if (!attendance) {
      throw new NotFoundException('Attendance not found');
    }

    this.ensureAttendanceCanBeApproved(attendance.status);
    await this.ensureApproverCanApproveEmployee(user, attendance.employeeId);

    return this.approvalRepository.approveAttendance(id, user.sub, notes);
  }

  async rejectAttendance(user: JwtUser, id: string, notes: string) {
    const attendance = await this.approvalRepository.findAttendanceById(id);

    if (!attendance) {
      throw new NotFoundException('Attendance not found');
    }

    this.ensureAttendanceCanBeApproved(attendance.status);
    await this.ensureApproverCanApproveEmployee(user, attendance.employeeId);

    return this.approvalRepository.rejectAttendance(id, user.sub, notes);
  }

  async approveDailyActivity(user: JwtUser, id: string, notes?: string) {
    const activity = await this.approvalRepository.findDailyActivityById(id);

    if (!activity) {
      throw new NotFoundException('Daily activity not found');
    }

    this.ensureActivityCanBeApproved(activity.status);
    await this.ensureApproverCanApproveEmployee(user, activity.employeeId);

    return this.approvalRepository.approveDailyActivity(id, user.sub, notes);
  }

  async rejectDailyActivity(user: JwtUser, id: string, notes: string) {
    const activity = await this.approvalRepository.findDailyActivityById(id);

    if (!activity) {
      throw new NotFoundException('Daily activity not found');
    }

    this.ensureActivityCanBeApproved(activity.status);
    await this.ensureApproverCanApproveEmployee(user, activity.employeeId);

    return this.approvalRepository.rejectDailyActivity(id, user.sub, notes);
  }

  async approveLeaveRequest(user: JwtUser, id: string, notes?: string) {
    const leaveRequest = await this.approvalRepository.findLeaveRequestById(id);

    if (!leaveRequest) {
      throw new NotFoundException('Leave request not found');
    }

    this.ensureLeaveRequestCanBeApproved(leaveRequest.status);
    await this.ensureApproverCanApproveEmployee(user, leaveRequest.employeeId);

    return this.approvalRepository.approveLeaveRequest(id, user.sub, notes);
  }

  async rejectLeaveRequest(user: JwtUser, id: string, notes: string) {
    const leaveRequest = await this.approvalRepository.findLeaveRequestById(id);

    if (!leaveRequest) {
      throw new NotFoundException('Leave request not found');
    }

    this.ensureLeaveRequestCanBeApproved(leaveRequest.status);
    await this.ensureApproverCanApproveEmployee(user, leaveRequest.employeeId);

    return this.approvalRepository.rejectLeaveRequest(id, user.sub, notes);
  }

  async listPendingAttendances(user: JwtUser) {
    const employeeScope = await this.resolveEmployeeScope(user);

    return this.approvalRepository.listPendingAttendances({
      deletedAt: null,
      approvedAt: null,
      status: {
        in: [
          AttendanceStatus.PRESENT,
          AttendanceStatus.LATE,
          AttendanceStatus.PENDING_APPROVAL,
        ],
      },
      employee: employeeScope,
    });
  }

  async listPendingDailyActivities(user: JwtUser) {
    const employeeScope = await this.resolveEmployeeScope(user);

    return this.approvalRepository.listPendingDailyActivities({
      deletedAt: null,
      status: ApprovalStatus.SUBMITTED,
      employee: employeeScope,
    });
  }

  async listPendingLeaveRequests(user: JwtUser) {
    const employeeScope = await this.resolveEmployeeScope(user);

    return this.approvalRepository.listPendingLeaveRequests({
      deletedAt: null,
      status: ApprovalStatus.SUBMITTED,
      employee: employeeScope,
    });
  }

  private ensureAttendanceCanBeApproved(status: AttendanceStatus) {
    const allowedStatuses: AttendanceStatus[] = [
      AttendanceStatus.PRESENT,
      AttendanceStatus.LATE,
      AttendanceStatus.PENDING_APPROVAL,
    ];

    if (!allowedStatuses.includes(status)) {
      throw new BadRequestException(
        `Attendance with status ${status} cannot be approved`,
      );
    }
  }

  private ensureActivityCanBeApproved(status: ApprovalStatus) {
    if (status !== ApprovalStatus.SUBMITTED) {
      throw new BadRequestException(
        `Daily activity with status ${status} cannot be approved`,
      );
    }
  }

  private ensureLeaveRequestCanBeApproved(status: ApprovalStatus) {
    if (status !== ApprovalStatus.SUBMITTED) {
      throw new BadRequestException(
        `Leave request with status ${status} cannot be approved`,
      );
    }
  }

  private async ensureApproverCanApproveEmployee(
    user: JwtUser,
    employeeId: string,
  ) {
    const role = user.role as RoleName;

    if (role === RoleName.ADMIN) {
      return;
    }

    if (role !== RoleName.SUPERVISOR) {
      throw new ForbiddenException(
        'Only admin or supervisor can approve records',
      );
    }

    const supervisor = await this.approvalRepository.findSupervisorByUserId(
      user.sub,
    );

    if (!supervisor) {
      throw new ForbiddenException('Supervisor profile not found');
    }

    const employee = await this.approvalRepository.findEmployeeById(employeeId);

    if (employee?.supervisorId !== supervisor.id) {
      throw new ForbiddenException('You cannot approve this employee record');
    }
  }

  private async resolveEmployeeScope(user: JwtUser) {
    const role = user.role as RoleName;

    if (role === RoleName.ADMIN) {
      return {};
    }

    if (role !== RoleName.SUPERVISOR) {
      throw new ForbiddenException(
        'Only admin or supervisor can access approvals',
      );
    }

    const supervisor = await this.approvalRepository.findSupervisorByUserId(
      user.sub,
    );

    if (!supervisor) {
      throw new ForbiddenException('Supervisor profile not found');
    }

    return { supervisorId: supervisor.id };
  }
}

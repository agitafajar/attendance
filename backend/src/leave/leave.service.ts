import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ApprovalStatus, RoleName } from '@prisma/client';
import type { JwtUser } from '../common/decorators/current-user.decorator';
import { toJakartaDateOnly } from '../common/date/jakarta-date';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { ListLeaveRequestQueryDto } from './dto/list-leave-request-query.dto';
import { LeaveRepository } from './leave.repository';

@Injectable()
export class LeaveService {
  constructor(private readonly leaveRepository: LeaveRepository) {}

  async create(user: JwtUser, dto: CreateLeaveRequestDto) {
    const employee = await this.leaveRepository.findEmployeeByUserId(user.sub);

    if (!employee) {
      throw new ForbiddenException('Only employees can create leave requests');
    }

    const startDate = toJakartaDateOnly(dto.startDate);
    const endDate = toJakartaDateOnly(dto.endDate);

    if (endDate < startDate) {
      throw new BadRequestException('endDate cannot be earlier than startDate');
    }

    return this.leaveRepository.create({
      employee: { connect: { id: employee.id } },
      type: dto.type,
      startDate,
      endDate,
      reason: dto.reason,
      attachmentUrl: dto.attachmentUrl,
      status: ApprovalStatus.SUBMITTED,
    });
  }

  async getMine(user: JwtUser, query: ListLeaveRequestQueryDto) {
    const employee = await this.leaveRepository.findEmployeeByUserId(user.sub);

    if (!employee) {
      throw new ForbiddenException(
        'Only employees can access own leave requests',
      );
    }

    return this.leaveRepository.list({
      ...this.buildDateFilter(query),
      employeeId: employee.id,
      type: query.type,
      status: query.status,
      deletedAt: null,
    });
  }

  async list(user: JwtUser, query: ListLeaveRequestQueryDto) {
    const role = user.role as RoleName;
    const where = {
      ...this.buildDateFilter(query),
      employeeId: query.employeeId,
      type: query.type,
      status: query.status,
      deletedAt: null,
      employee: {},
    };

    if (role === RoleName.EMPLOYEE) {
      const employee = await this.leaveRepository.findEmployeeByUserId(
        user.sub,
      );

      if (!employee) {
        throw new ForbiddenException('Employee profile not found');
      }

      where.employeeId = employee.id;
    }

    if (role === RoleName.SUPERVISOR) {
      const supervisor = await this.leaveRepository.findSupervisorByUserId(
        user.sub,
      );

      if (!supervisor) {
        throw new ForbiddenException('Supervisor profile not found');
      }

      where.employee = { supervisorId: supervisor.id };
    }

    return this.leaveRepository.list(where);
  }

  async findOne(user: JwtUser, id: string) {
    const leaveRequest = await this.leaveRepository.findById(id);

    if (!leaveRequest) {
      throw new NotFoundException('Leave request not found');
    }

    await this.ensureCanRead(user, leaveRequest.employeeId);
    return leaveRequest;
  }

  async cancel(user: JwtUser, id: string) {
    const leaveRequest = await this.leaveRepository.findById(id);

    if (!leaveRequest) {
      throw new NotFoundException('Leave request not found');
    }

    const employee = await this.leaveRepository.findEmployeeByUserId(user.sub);

    if (!employee || leaveRequest.employeeId !== employee.id) {
      throw new ForbiddenException('You cannot cancel this leave request');
    }

    if (leaveRequest.status !== ApprovalStatus.SUBMITTED) {
      throw new BadRequestException(
        'Only submitted leave requests can be cancelled',
      );
    }

    return this.leaveRepository.update(id, {
      deletedAt: new Date(),
    });
  }

  private buildDateFilter(query: ListLeaveRequestQueryDto) {
    const startDate = query.startDate
      ? toJakartaDateOnly(query.startDate)
      : undefined;
    const endDate = query.endDate
      ? toJakartaDateOnly(query.endDate)
      : undefined;

    return {
      startDate:
        startDate || endDate
          ? {
              gte: startDate,
              lte: endDate,
            }
          : undefined,
    };
  }

  private async ensureCanRead(user: JwtUser, employeeId: string) {
    const role = user.role as RoleName;

    if (role === RoleName.ADMIN) {
      return;
    }

    if (role === RoleName.EMPLOYEE) {
      const employee = await this.leaveRepository.findEmployeeByUserId(
        user.sub,
      );

      if (employee?.id !== employeeId) {
        throw new ForbiddenException('You cannot access this leave request');
      }

      return;
    }

    if (role === RoleName.SUPERVISOR) {
      const supervisor = await this.leaveRepository.findSupervisorByUserId(
        user.sub,
      );

      if (!supervisor) {
        throw new ForbiddenException('Supervisor profile not found');
      }

      const targetEmployee =
        await this.leaveRepository.findEmployeeById(employeeId);

      if (targetEmployee?.supervisorId !== supervisor.id) {
        throw new ForbiddenException('You cannot access this leave request');
      }
    }
  }
}

import { ForbiddenException, Injectable } from '@nestjs/common';
import { ApprovalStatus } from '@prisma/client';
import type { JwtUser } from '../common/decorators/current-user.decorator';
import { toJakartaDateOnly } from '../common/date/jakarta-date';
import { PrismaService } from '../prisma/prisma.service';
import {
  MobileActivityHistoryQueryDto,
  MobileAttendanceHistoryQueryDto,
  MobileLeaveHistoryQueryDto,
  MobilePaginationQueryDto,
} from './dto/mobile-history-query.dto';

@Injectable()
export class MobileService {
  constructor(private readonly prisma: PrismaService) {}

  async me(user: JwtUser) {
    return this.prisma.user.findFirst({
      where: { id: user.sub, deletedAt: null, isActive: true },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        employee: {
          where: { deletedAt: null },
          include: {
            supervisor: {
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
          },
        },
        supervisor: {
          where: { deletedAt: null },
        },
      },
    });
  }

  async today(user: JwtUser) {
    const employee = await this.findEmployee(user);
    const today = toJakartaDateOnly(new Date());

    const [attendance, activities, activeLeaveRequests, activeAssignments] =
      await Promise.all([
        this.prisma.attendance.findUnique({
          where: {
            employeeId_attendanceDate: {
              employeeId: employee.id,
              attendanceDate: today,
            },
          },
          include: {
            assignment: {
              include: {
                client: true,
                workLocation: true,
                shift: true,
              },
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
          where: {
            deletedAt: null,
            employeeId: employee.id,
            OR: [
              {
                status: ApprovalStatus.APPROVED,
                startDate: { lte: today },
                endDate: { gte: today },
              },
              { status: ApprovalStatus.SUBMITTED },
            ],
          },
          orderBy: { createdAt: 'desc' },
        }),
        this.findActiveAssignments(employee.id, today),
      ]);

    return {
      date: today,
      employee,
      attendance,
      activities,
      activeLeaveRequests,
      activeAssignments,
    };
  }

  async activeAssignments(user: JwtUser) {
    const employee = await this.findEmployee(user);
    const today = toJakartaDateOnly(new Date());

    return {
      date: today,
      employeeId: employee.id,
      assignments: await this.findActiveAssignments(employee.id, today),
    };
  }

  async attendanceHistory(
    user: JwtUser,
    query: MobileAttendanceHistoryQueryDto,
  ) {
    const employee = await this.findEmployee(user);
    const pagination = this.pagination(query);
    const where = {
      deletedAt: null,
      employeeId: employee.id,
      status: query.status,
      attendanceDate: this.dateRange(query),
    };

    const [items, total] = await Promise.all([
      this.prisma.attendance.findMany({
        where,
        include: {
          assignment: {
            include: {
              client: true,
              workLocation: true,
              shift: true,
            },
          },
        },
        orderBy: [{ attendanceDate: 'desc' }, { createdAt: 'desc' }],
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.attendance.count({ where }),
    ]);

    return this.paginated(items, total, pagination);
  }

  async activityHistory(user: JwtUser, query: MobileActivityHistoryQueryDto) {
    const employee = await this.findEmployee(user);
    const pagination = this.pagination(query);
    const where = {
      deletedAt: null,
      employeeId: employee.id,
      status: query.status,
      activityDate: this.dateRange(query),
    };

    const [items, total] = await Promise.all([
      this.prisma.dailyActivity.findMany({
        where,
        include: { photos: { where: { deletedAt: null } } },
        orderBy: [{ activityDate: 'desc' }, { createdAt: 'desc' }],
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.dailyActivity.count({ where }),
    ]);

    return this.paginated(items, total, pagination);
  }

  async leaveHistory(user: JwtUser, query: MobileLeaveHistoryQueryDto) {
    const employee = await this.findEmployee(user);
    const pagination = this.pagination(query);
    const where = {
      deletedAt: null,
      employeeId: employee.id,
      type: query.type,
      status: query.status,
      startDate: this.dateRange(query),
    };

    const [items, total] = await Promise.all([
      this.prisma.leaveRequest.findMany({
        where,
        orderBy: [{ startDate: 'desc' }, { createdAt: 'desc' }],
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.leaveRequest.count({ where }),
    ]);

    return this.paginated(items, total, pagination);
  }

  private async findEmployee(user: JwtUser) {
    const employee = await this.prisma.employee.findFirst({
      where: { userId: user.sub, deletedAt: null },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
          },
        },
        supervisor: {
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
      },
    });

    if (!employee) {
      throw new ForbiddenException('Employee profile not found');
    }

    return employee;
  }

  private findActiveAssignments(employeeId: string, today: Date) {
    return this.prisma.employeeAssignment.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        employeeId,
        startDate: { lte: today },
        OR: [{ endDate: null }, { endDate: { gte: today } }],
      },
      include: {
        client: true,
        workLocation: true,
        shift: true,
      },
      orderBy: { startDate: 'desc' },
    });
  }

  private pagination(query: MobilePaginationQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    return {
      page,
      limit,
      skip: (page - 1) * limit,
    };
  }

  private dateRange(query: MobilePaginationQueryDto) {
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

  private paginated<T>(
    items: T[],
    total: number,
    pagination: { page: number; limit: number },
  ) {
    return {
      items,
      meta: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
      },
    };
  }
}

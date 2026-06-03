import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LeaveRepository {
  constructor(private readonly prisma: PrismaService) {}

  findEmployeeByUserId(userId: string) {
    return this.prisma.employee.findFirst({
      where: { userId, deletedAt: null },
    });
  }

  findEmployeeById(id: string) {
    return this.prisma.employee.findFirst({
      where: { id, deletedAt: null },
    });
  }

  findSupervisorByUserId(userId: string) {
    return this.prisma.supervisor.findFirst({
      where: { userId, deletedAt: null },
    });
  }

  create(data: Prisma.LeaveRequestCreateInput) {
    return this.prisma.leaveRequest.create({
      data,
      include: this.defaultInclude(),
    });
  }

  update(id: string, data: Prisma.LeaveRequestUpdateInput) {
    return this.prisma.leaveRequest.update({
      where: { id },
      data,
      include: this.defaultInclude(),
    });
  }

  findById(id: string) {
    return this.prisma.leaveRequest.findFirst({
      where: { id, deletedAt: null },
      include: this.defaultInclude(),
    });
  }

  list(where: Prisma.LeaveRequestWhereInput) {
    return this.prisma.leaveRequest.findMany({
      where,
      include: this.defaultInclude(),
      orderBy: [{ startDate: 'desc' }, { createdAt: 'desc' }],
    });
  }

  private defaultInclude() {
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
          supervisor: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                },
              },
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

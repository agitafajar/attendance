import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AttendanceRepository {
  constructor(private readonly prisma: PrismaService) {}

  findEmployeeByUserId(userId: string) {
    return this.prisma.employee.findFirst({
      where: { userId, deletedAt: null },
      include: { supervisor: true },
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

  findActiveAssignments(
    employeeId: string,
    attendanceDate: Date,
    assignmentId?: string,
  ) {
    return this.prisma.employeeAssignment.findMany({
      where: {
        id: assignmentId,
        employeeId,
        isActive: true,
        deletedAt: null,
        startDate: { lte: attendanceDate },
        OR: [{ endDate: null }, { endDate: { gte: attendanceDate } }],
        client: { isActive: true, deletedAt: null },
        workLocation: { isActive: true, deletedAt: null },
        shift: { isActive: true, deletedAt: null },
      },
      include: {
        employee: true,
        client: true,
        workLocation: true,
        shift: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findByEmployeeAndDate(employeeId: string, attendanceDate: Date) {
    return this.prisma.attendance.findUnique({
      where: { employeeId_attendanceDate: { employeeId, attendanceDate } },
      include: this.defaultInclude(),
    });
  }

  findById(id: string) {
    return this.prisma.attendance.findFirst({
      where: { id, deletedAt: null },
      include: this.defaultInclude(),
    });
  }

  create(data: Prisma.AttendanceCreateInput) {
    return this.prisma.attendance.create({
      data,
      include: this.defaultInclude(),
    });
  }

  update(id: string, data: Prisma.AttendanceUpdateInput) {
    return this.prisma.attendance.update({
      where: { id },
      data,
      include: this.defaultInclude(),
    });
  }

  list(where: Prisma.AttendanceWhereInput) {
    return this.prisma.attendance.findMany({
      where,
      include: this.defaultInclude(),
      orderBy: [{ attendanceDate: 'desc' }, { createdAt: 'desc' }],
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
}

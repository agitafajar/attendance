import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DailyActivityRepository {
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

  findAttendanceById(id: string) {
    return this.prisma.attendance.findFirst({
      where: { id, deletedAt: null },
    });
  }

  findAttendanceByEmployeeAndDate(employeeId: string, attendanceDate: Date) {
    return this.prisma.attendance.findUnique({
      where: { employeeId_attendanceDate: { employeeId, attendanceDate } },
    });
  }

  create(data: Prisma.DailyActivityCreateInput) {
    return this.prisma.dailyActivity.create({
      data,
      include: this.defaultInclude(),
    });
  }

  update(id: string, data: Prisma.DailyActivityUpdateInput) {
    return this.prisma.dailyActivity.update({
      where: { id },
      data,
      include: this.defaultInclude(),
    });
  }

  findById(id: string) {
    return this.prisma.dailyActivity.findFirst({
      where: { id, deletedAt: null },
      include: this.defaultInclude(),
    });
  }

  list(where: Prisma.DailyActivityWhereInput) {
    return this.prisma.dailyActivity.findMany({
      where,
      include: this.defaultInclude(),
      orderBy: [{ activityDate: 'desc' }, { createdAt: 'desc' }],
    });
  }

  deletePhotos(dailyActivityId: string) {
    return this.prisma.dailyActivityPhoto.updateMany({
      where: { dailyActivityId, deletedAt: null },
      data: { deletedAt: new Date() },
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
}

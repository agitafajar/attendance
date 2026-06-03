import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AttendanceStatus, RoleName } from '@prisma/client';
import type { JwtUser } from '../common/decorators/current-user.decorator';
import {
  getTimeOnlyUtcParts,
  jakartaDateTimeToUtc,
  toJakartaDateOnly,
} from '../common/date/jakarta-date';
import { CheckInDto } from './dto/check-in.dto';
import { CheckOutDto } from './dto/check-out.dto';
import { ListAttendanceQueryDto } from './dto/list-attendance-query.dto';
import { AttendanceRepository } from './attendance.repository';

@Injectable()
export class AttendanceService {
  constructor(private readonly attendanceRepository: AttendanceRepository) {}

  async checkIn(user: JwtUser, dto: CheckInDto) {
    const employee = await this.attendanceRepository.findEmployeeByUserId(
      user.sub,
    );

    if (!employee) {
      throw new ForbiddenException('Only employees can check in');
    }

    const now = new Date();
    const attendanceDate = toJakartaDateOnly(dto.attendanceDate ?? now);
    const existingAttendance =
      await this.attendanceRepository.findByEmployeeAndDate(
        employee.id,
        attendanceDate,
      );

    if (existingAttendance?.checkInTime) {
      throw new BadRequestException(
        'Employee already checked in for this date',
      );
    }

    const assignment = await this.resolveAssignment(
      employee.id,
      attendanceDate,
      dto.assignmentId,
    );
    const distanceMeter = this.calculateDistanceMeter(
      dto.latitude,
      dto.longitude,
      Number(assignment.workLocation.latitude),
      Number(assignment.workLocation.longitude),
    );

    if (distanceMeter > assignment.workLocation.geofenceRadiusMeter) {
      throw new BadRequestException({
        message: 'Check-in location is outside geofence radius',
        distanceMeter: Math.round(distanceMeter),
        allowedRadiusMeter: assignment.workLocation.geofenceRadiusMeter,
      });
    }

    const lateMinutes = this.calculateLateMinutes(
      now,
      attendanceDate,
      assignment.shift.startTime,
      assignment.shift.gracePeriodMinutes,
    );
    const status =
      lateMinutes > 0 ? AttendanceStatus.LATE : AttendanceStatus.PRESENT;

    return this.attendanceRepository.create({
      employee: { connect: { id: employee.id } },
      assignment: { connect: { id: assignment.id } },
      attendanceDate,
      checkInTime: now,
      checkInLatitude: dto.latitude,
      checkInLongitude: dto.longitude,
      checkInPhoto: dto.photoUrl,
      distanceMeter,
      lateMinutes,
      status,
    });
  }

  async checkOut(user: JwtUser, dto: CheckOutDto) {
    const employee = await this.attendanceRepository.findEmployeeByUserId(
      user.sub,
    );

    if (!employee) {
      throw new ForbiddenException('Only employees can check out');
    }

    const now = new Date();
    const attendanceDate = toJakartaDateOnly(dto.attendanceDate ?? now);
    const attendance = await this.attendanceRepository.findByEmployeeAndDate(
      employee.id,
      attendanceDate,
    );

    if (!attendance?.checkInTime) {
      throw new BadRequestException(
        'Employee has not checked in for this date',
      );
    }

    if (attendance.checkOutTime) {
      throw new BadRequestException(
        'Employee already checked out for this date',
      );
    }

    const workLocation = attendance.assignment.workLocation;
    const distanceMeter = this.calculateDistanceMeter(
      dto.latitude,
      dto.longitude,
      Number(workLocation.latitude),
      Number(workLocation.longitude),
    );

    if (distanceMeter > workLocation.geofenceRadiusMeter) {
      throw new BadRequestException({
        message: 'Check-out location is outside geofence radius',
        distanceMeter: Math.round(distanceMeter),
        allowedRadiusMeter: workLocation.geofenceRadiusMeter,
      });
    }

    const workMinutes = Math.max(
      0,
      Math.floor((now.getTime() - attendance.checkInTime.getTime()) / 60000),
    );

    return this.attendanceRepository.update(attendance.id, {
      checkOutTime: now,
      checkOutLatitude: dto.latitude,
      checkOutLongitude: dto.longitude,
      checkOutPhoto: dto.photoUrl,
      distanceMeter,
      workMinutes,
    });
  }

  async getMine(user: JwtUser, date?: string) {
    const employee = await this.attendanceRepository.findEmployeeByUserId(
      user.sub,
    );

    if (!employee) {
      throw new ForbiddenException('Only employees can access own attendance');
    }

    const attendanceDate = toJakartaDateOnly(date ?? new Date());
    return this.attendanceRepository.findByEmployeeAndDate(
      employee.id,
      attendanceDate,
    );
  }

  async list(user: JwtUser, query: ListAttendanceQueryDto) {
    const role = user.role as RoleName;
    const startDate = query.startDate
      ? toJakartaDateOnly(query.startDate)
      : undefined;
    const endDate = query.endDate
      ? toJakartaDateOnly(query.endDate)
      : undefined;

    const where = {
      deletedAt: null,
      status: query.status,
      employeeId: query.employeeId,
      attendanceDate:
        startDate || endDate
          ? {
              gte: startDate,
              lte: endDate,
            }
          : undefined,
      assignment: {
        clientId: query.clientId,
        workLocationId: query.workLocationId,
      },
      employee: {},
    };

    if (role === RoleName.EMPLOYEE) {
      const employee = await this.attendanceRepository.findEmployeeByUserId(
        user.sub,
      );

      if (!employee) {
        throw new ForbiddenException('Employee profile not found');
      }

      where.employeeId = employee.id;
    }

    if (role === RoleName.SUPERVISOR) {
      const supervisor = await this.attendanceRepository.findSupervisorByUserId(
        user.sub,
      );

      if (!supervisor) {
        throw new ForbiddenException('Supervisor profile not found');
      }

      where.employee = { supervisorId: supervisor.id };
    }

    return this.attendanceRepository.list(where);
  }

  async findOne(user: JwtUser, id: string) {
    const attendance = await this.attendanceRepository.findById(id);

    if (!attendance) {
      throw new NotFoundException('Attendance not found');
    }

    await this.ensureCanRead(user, attendance.employeeId);
    return attendance;
  }

  private async resolveAssignment(
    employeeId: string,
    attendanceDate: Date,
    assignmentId?: string,
  ) {
    const assignments = await this.attendanceRepository.findActiveAssignments(
      employeeId,
      attendanceDate,
      assignmentId,
    );

    if (!assignments.length) {
      throw new BadRequestException('No active assignment found for this date');
    }

    if (!assignmentId && assignments.length > 1) {
      throw new BadRequestException(
        'assignmentId is required for multiple active assignments',
      );
    }

    return assignments[0];
  }

  private async ensureCanRead(user: JwtUser, employeeId: string) {
    const role = user.role as RoleName;

    if (role === RoleName.ADMIN) {
      return;
    }

    if (role === RoleName.EMPLOYEE) {
      const employee = await this.attendanceRepository.findEmployeeByUserId(
        user.sub,
      );

      if (employee?.id !== employeeId) {
        throw new ForbiddenException('You cannot access this attendance');
      }

      return;
    }

    if (role === RoleName.SUPERVISOR) {
      const supervisor = await this.attendanceRepository.findSupervisorByUserId(
        user.sub,
      );

      if (!supervisor) {
        throw new ForbiddenException('Supervisor profile not found');
      }

      const targetEmployee =
        await this.attendanceRepository.findEmployeeById(employeeId);

      if (targetEmployee?.supervisorId !== supervisor.id) {
        throw new ForbiddenException('You cannot access this attendance');
      }
    }
  }

  private calculateLateMinutes(
    checkInTime: Date,
    attendanceDate: Date,
    shiftStartTime: Date,
    gracePeriodMinutes: number,
  ) {
    const shiftStart = getTimeOnlyUtcParts(shiftStartTime);
    const shiftStartAt = jakartaDateTimeToUtc(
      attendanceDate,
      shiftStart.hours,
      shiftStart.minutes + gracePeriodMinutes,
    );

    return Math.max(
      0,
      Math.floor((checkInTime.getTime() - shiftStartAt.getTime()) / 60000),
    );
  }

  private calculateDistanceMeter(
    latitudeA: number,
    longitudeA: number,
    latitudeB: number,
    longitudeB: number,
  ) {
    const earthRadiusMeter = 6371000;
    const latitudeDelta = this.toRadians(latitudeB - latitudeA);
    const longitudeDelta = this.toRadians(longitudeB - longitudeA);
    const a =
      Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
      Math.cos(this.toRadians(latitudeA)) *
        Math.cos(this.toRadians(latitudeB)) *
        Math.sin(longitudeDelta / 2) *
        Math.sin(longitudeDelta / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return earthRadiusMeter * c;
  }

  private toRadians(value: number) {
    return (value * Math.PI) / 180;
  }
}

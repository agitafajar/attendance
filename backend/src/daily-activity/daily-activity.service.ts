import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ApprovalStatus, RoleName } from '@prisma/client';
import type { JwtUser } from '../common/decorators/current-user.decorator';
import { toJakartaDateOnly } from '../common/date/jakarta-date';
import { DailyActivityRepository } from './daily-activity.repository';
import { CreateDailyActivityDto } from './dto/create-daily-activity.dto';
import { ListDailyActivityQueryDto } from './dto/list-daily-activity-query.dto';
import { UpdateDailyActivityDto } from './dto/update-daily-activity.dto';

@Injectable()
export class DailyActivityService {
  constructor(
    private readonly dailyActivityRepository: DailyActivityRepository,
  ) {}

  async create(user: JwtUser, dto: CreateDailyActivityDto) {
    const employee = await this.dailyActivityRepository.findEmployeeByUserId(
      user.sub,
    );

    if (!employee) {
      throw new ForbiddenException(
        'Only employees can create daily activities',
      );
    }

    const status = dto.status ?? ApprovalStatus.DRAFT;

    const allowedCreateStatuses: ApprovalStatus[] = [
      ApprovalStatus.DRAFT,
      ApprovalStatus.SUBMITTED,
    ];

    if (!allowedCreateStatuses.includes(status)) {
      throw new BadRequestException(
        'Activity can only be created as DRAFT or SUBMITTED',
      );
    }

    const activityDate = toJakartaDateOnly(dto.activityDate);
    const attendance = await this.resolveAttendance(
      employee.id,
      activityDate,
      dto.attendanceId,
    );

    return this.dailyActivityRepository.create({
      employee: { connect: { id: employee.id } },
      attendance: attendance ? { connect: { id: attendance.id } } : undefined,
      activityDate,
      title: dto.title,
      description: dto.description,
      latitude: dto.latitude,
      longitude: dto.longitude,
      status,
      photos: this.mapPhotoCreate(dto.photoUrls),
    });
  }

  async update(user: JwtUser, id: string, dto: UpdateDailyActivityDto) {
    const activity = await this.findEditableActivity(user, id);

    if (activity.status !== ApprovalStatus.DRAFT) {
      throw new BadRequestException('Only draft activities can be updated');
    }

    const employeeId = activity.employeeId;
    const activityDate = dto.activityDate
      ? toJakartaDateOnly(dto.activityDate)
      : undefined;
    const attendance =
      activityDate || dto.attendanceId
        ? await this.resolveAttendance(
            employeeId,
            activityDate ?? activity.activityDate,
            dto.attendanceId,
          )
        : undefined;

    if (dto.photoUrls) {
      await this.dailyActivityRepository.deletePhotos(id);
    }

    return this.dailyActivityRepository.update(id, {
      attendance: attendance ? { connect: { id: attendance.id } } : undefined,
      activityDate,
      title: dto.title,
      description: dto.description,
      latitude: dto.latitude,
      longitude: dto.longitude,
      photos: this.mapPhotoCreate(dto.photoUrls),
    });
  }

  async submit(user: JwtUser, id: string) {
    const activity = await this.findEditableActivity(user, id);

    if (activity.status !== ApprovalStatus.DRAFT) {
      throw new BadRequestException('Only draft activities can be submitted');
    }

    return this.dailyActivityRepository.update(id, {
      status: ApprovalStatus.SUBMITTED,
    });
  }

  async getMine(user: JwtUser, date?: string) {
    const employee = await this.dailyActivityRepository.findEmployeeByUserId(
      user.sub,
    );

    if (!employee) {
      throw new ForbiddenException('Only employees can access own activities');
    }

    const activityDate = toJakartaDateOnly(date ?? new Date());

    return this.dailyActivityRepository.list({
      employeeId: employee.id,
      activityDate,
      deletedAt: null,
    });
  }

  async list(user: JwtUser, query: ListDailyActivityQueryDto) {
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
      attendanceId: query.attendanceId,
      activityDate:
        startDate || endDate
          ? {
              gte: startDate,
              lte: endDate,
            }
          : undefined,
      employee: {},
    };

    if (role === RoleName.EMPLOYEE) {
      const employee = await this.dailyActivityRepository.findEmployeeByUserId(
        user.sub,
      );

      if (!employee) {
        throw new ForbiddenException('Employee profile not found');
      }

      where.employeeId = employee.id;
    }

    if (role === RoleName.SUPERVISOR) {
      const supervisor =
        await this.dailyActivityRepository.findSupervisorByUserId(user.sub);

      if (!supervisor) {
        throw new ForbiddenException('Supervisor profile not found');
      }

      where.employee = { supervisorId: supervisor.id };
    }

    return this.dailyActivityRepository.list(where);
  }

  async findOne(user: JwtUser, id: string) {
    const activity = await this.dailyActivityRepository.findById(id);

    if (!activity) {
      throw new NotFoundException('Daily activity not found');
    }

    await this.ensureCanRead(user, activity.employeeId);
    return activity;
  }

  async remove(user: JwtUser, id: string) {
    const activity = await this.findEditableActivity(user, id);

    if (activity.status !== ApprovalStatus.DRAFT) {
      throw new BadRequestException('Only draft activities can be deleted');
    }

    return this.dailyActivityRepository.update(id, {
      deletedAt: new Date(),
      photos: {
        updateMany: {
          where: { deletedAt: null },
          data: { deletedAt: new Date() },
        },
      },
    });
  }

  private async findEditableActivity(user: JwtUser, id: string) {
    const activity = await this.dailyActivityRepository.findById(id);

    if (!activity) {
      throw new NotFoundException('Daily activity not found');
    }

    const employee = await this.dailyActivityRepository.findEmployeeByUserId(
      user.sub,
    );

    if (!employee || activity.employeeId !== employee.id) {
      throw new ForbiddenException('You cannot modify this activity');
    }

    return activity;
  }

  private async resolveAttendance(
    employeeId: string,
    activityDate: Date,
    attendanceId?: string,
  ) {
    if (attendanceId) {
      const attendance =
        await this.dailyActivityRepository.findAttendanceById(attendanceId);

      if (!attendance || attendance.employeeId !== employeeId) {
        throw new BadRequestException(
          'Attendance does not belong to this employee',
        );
      }

      return attendance;
    }

    return this.dailyActivityRepository.findAttendanceByEmployeeAndDate(
      employeeId,
      activityDate,
    );
  }

  private async ensureCanRead(user: JwtUser, employeeId: string) {
    const role = user.role as RoleName;

    if (role === RoleName.ADMIN) {
      return;
    }

    if (role === RoleName.EMPLOYEE) {
      const employee = await this.dailyActivityRepository.findEmployeeByUserId(
        user.sub,
      );

      if (employee?.id !== employeeId) {
        throw new ForbiddenException('You cannot access this activity');
      }

      return;
    }

    if (role === RoleName.SUPERVISOR) {
      const supervisor =
        await this.dailyActivityRepository.findSupervisorByUserId(user.sub);

      if (!supervisor) {
        throw new ForbiddenException('Supervisor profile not found');
      }

      const targetEmployee =
        await this.dailyActivityRepository.findEmployeeById(employeeId);

      if (targetEmployee?.supervisorId !== supervisor.id) {
        throw new ForbiddenException('You cannot access this activity');
      }
    }
  }

  private mapPhotoCreate(photoUrls?: string[]) {
    if (!photoUrls?.length) {
      return undefined;
    }

    return {
      create: photoUrls.map((photoUrl) => ({ photoUrl })),
    };
  }
}

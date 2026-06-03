import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RoleName } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import type { JwtUser } from '../common/decorators/current-user.decorator';
import { toJakartaDateOnly } from '../common/date/jakarta-date';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateAssignmentDto,
  CreateClientDto,
  CreateEmployeeDto,
  CreateShiftDto,
  CreateSupervisorDto,
  CreateWorkLocationDto,
  UpdateAssignmentDto,
  UpdateClientDto,
  UpdateEmployeeDto,
  UpdateShiftDto,
  UpdateSupervisorDto,
  UpdateWorkLocationDto,
} from './dto/master-data.dto';

@Injectable()
export class MasterDataService {
  constructor(private readonly prisma: PrismaService) {}

  async listClients(user: JwtUser) {
    const scope = await this.resolveSupervisorScope(user);

    return this.prisma.client.findMany({
      where: {
        deletedAt: null,
        assignments: scope.supervisorId
          ? {
              some: {
                deletedAt: null,
                employee: {
                  deletedAt: null,
                  supervisorId: scope.supervisorId,
                },
              },
            }
          : undefined,
      },
      orderBy: { name: 'asc' },
    });
  }

  createClient(dto: CreateClientDto) {
    return this.prisma.client.create({ data: dto });
  }

  updateClient(id: string, dto: UpdateClientDto) {
    return this.prisma.client.update({ where: { id }, data: dto });
  }

  deleteClient(id: string) {
    return this.prisma.client.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async listWorkLocations(user: JwtUser, clientId?: string) {
    const scope = await this.resolveSupervisorScope(user);

    return this.prisma.workLocation.findMany({
      where: {
        clientId,
        deletedAt: null,
        assignments: scope.supervisorId
          ? {
              some: {
                deletedAt: null,
                employee: {
                  deletedAt: null,
                  supervisorId: scope.supervisorId,
                },
              },
            }
          : undefined,
      },
      include: { client: true },
      orderBy: { name: 'asc' },
    });
  }

  createWorkLocation(dto: CreateWorkLocationDto) {
    return this.prisma.workLocation.create({ data: dto });
  }

  updateWorkLocation(id: string, dto: UpdateWorkLocationDto) {
    return this.prisma.workLocation.update({ where: { id }, data: dto });
  }

  deleteWorkLocation(id: string) {
    return this.prisma.workLocation.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async listShifts(user: JwtUser) {
    const scope = await this.resolveSupervisorScope(user);

    return this.prisma.shift.findMany({
      where: {
        deletedAt: null,
        assignments: scope.supervisorId
          ? {
              some: {
                deletedAt: null,
                employee: {
                  deletedAt: null,
                  supervisorId: scope.supervisorId,
                },
              },
            }
          : undefined,
      },
      orderBy: { code: 'asc' },
    });
  }

  createShift(dto: CreateShiftDto) {
    return this.prisma.shift.create({
      data: {
        code: dto.code,
        name: dto.name,
        startTime: this.parseTime(dto.startTime),
        endTime: this.parseTime(dto.endTime),
        gracePeriodMinutes: dto.gracePeriodMinutes ?? 0,
      },
    });
  }

  updateShift(id: string, dto: UpdateShiftDto) {
    return this.prisma.shift.update({
      where: { id },
      data: {
        code: dto.code,
        name: dto.name,
        startTime: dto.startTime ? this.parseTime(dto.startTime) : undefined,
        endTime: dto.endTime ? this.parseTime(dto.endTime) : undefined,
        gracePeriodMinutes: dto.gracePeriodMinutes,
        isActive: dto.isActive,
      },
    });
  }

  deleteShift(id: string) {
    return this.prisma.shift.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async listSupervisors(user: JwtUser) {
    const scope = await this.resolveSupervisorScope(user);

    return this.prisma.supervisor.findMany({
      where: {
        deletedAt: null,
        id: scope.supervisorId,
      },
      include: { user: { include: { role: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createSupervisor(dto: CreateSupervisorDto) {
    const role = await this.findRole(RoleName.SUPERVISOR);
    const passwordHash = await bcrypt.hash(dto.password, 12);

    return this.prisma.supervisor.create({
      data: {
        supervisorNumber: dto.supervisorNumber,
        user: {
          create: {
            email: dto.email,
            fullName: dto.fullName,
            phone: dto.phone,
            passwordHash,
            roleId: role.id,
          },
        },
      },
      include: { user: { include: { role: true } } },
    });
  }

  updateSupervisor(id: string, dto: UpdateSupervisorDto) {
    return this.prisma.supervisor.update({
      where: { id },
      data: {
        supervisorNumber: dto.supervisorNumber,
        user: {
          update: {
            email: dto.email,
            fullName: dto.fullName,
            phone: dto.phone,
            isActive: dto.isActive,
          },
        },
      },
      include: { user: { include: { role: true } } },
    });
  }

  async deleteSupervisor(id: string) {
    const supervisor = await this.prisma.supervisor.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!supervisor) {
      throw new NotFoundException('Supervisor not found');
    }

    return this.prisma.supervisor.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        user: {
          update: {
            deletedAt: new Date(),
            isActive: false,
          },
        },
      },
      include: { user: { include: { role: true } } },
    });
  }

  async listEmployees(user: JwtUser) {
    const scope = await this.resolveSupervisorScope(user);

    return this.prisma.employee.findMany({
      where: {
        deletedAt: null,
        supervisorId: scope.supervisorId,
      },
      include: {
        user: { include: { role: true } },
        supervisor: { include: { user: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createEmployee(dto: CreateEmployeeDto) {
    const role = await this.findRole(RoleName.EMPLOYEE);
    const passwordHash = await bcrypt.hash(dto.password, 12);

    return this.prisma.employee.create({
      data: {
        employeeNumber: dto.employeeNumber,
        supervisor: dto.supervisorId
          ? { connect: { id: dto.supervisorId } }
          : undefined,
        position: dto.position,
        joinDate: dto.joinDate ? toJakartaDateOnly(dto.joinDate) : undefined,
        employmentStatus: dto.employmentStatus,
        user: {
          create: {
            email: dto.email,
            fullName: dto.fullName,
            phone: dto.phone,
            passwordHash,
            roleId: role.id,
          },
        },
      },
      include: {
        user: { include: { role: true } },
        supervisor: { include: { user: true } },
      },
    });
  }

  updateEmployee(id: string, dto: UpdateEmployeeDto) {
    return this.prisma.employee.update({
      where: { id },
      data: {
        supervisor: dto.supervisorId
          ? { connect: { id: dto.supervisorId } }
          : undefined,
        position: dto.position,
        employmentStatus: dto.employmentStatus,
      },
      include: {
        user: { include: { role: true } },
        supervisor: { include: { user: true } },
      },
    });
  }

  deleteEmployee(id: string) {
    return this.prisma.employee.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async listAssignments(user: JwtUser, employeeId?: string) {
    const scope = await this.resolveSupervisorScope(user);

    return this.prisma.employeeAssignment.findMany({
      where: {
        employeeId,
        deletedAt: null,
        employee: scope.supervisorId
          ? {
              deletedAt: null,
              supervisorId: scope.supervisorId,
            }
          : undefined,
      },
      include: {
        employee: { include: { user: true } },
        client: true,
        workLocation: true,
        shift: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  createAssignment(dto: CreateAssignmentDto) {
    const startDate = toJakartaDateOnly(dto.startDate);
    const endDate = dto.endDate ? toJakartaDateOnly(dto.endDate) : undefined;

    if (endDate && endDate < startDate) {
      throw new BadRequestException('endDate cannot be earlier than startDate');
    }

    return this.prisma.employeeAssignment.create({
      data: {
        employeeId: dto.employeeId,
        clientId: dto.clientId,
        workLocationId: dto.workLocationId,
        shiftId: dto.shiftId,
        startDate,
        endDate,
      },
      include: {
        employee: { include: { user: true } },
        client: true,
        workLocation: true,
        shift: true,
      },
    });
  }

  updateAssignment(id: string, dto: UpdateAssignmentDto) {
    return this.prisma.employeeAssignment.update({
      where: { id },
      data: {
        employeeId: dto.employeeId,
        clientId: dto.clientId,
        workLocationId: dto.workLocationId,
        shiftId: dto.shiftId,
        startDate: dto.startDate ? toJakartaDateOnly(dto.startDate) : undefined,
        endDate: dto.endDate ? toJakartaDateOnly(dto.endDate) : undefined,
        isActive: dto.isActive,
      },
      include: {
        employee: { include: { user: true } },
        client: true,
        workLocation: true,
        shift: true,
      },
    });
  }

  deleteAssignment(id: string) {
    return this.prisma.employeeAssignment.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  private async findRole(name: RoleName) {
    const role = await this.prisma.role.findUnique({ where: { name } });

    if (!role) {
      throw new NotFoundException(
        `Role ${name} not found. Run prisma seed first.`,
      );
    }

    return role;
  }

  private async resolveSupervisorScope(user: JwtUser) {
    const role = user.role as RoleName;

    if (role === RoleName.ADMIN) {
      return {};
    }

    if (role !== RoleName.SUPERVISOR) {
      return {};
    }

    const supervisor = await this.prisma.supervisor.findFirst({
      where: { userId: user.sub, deletedAt: null },
      select: { id: true },
    });

    if (!supervisor) {
      throw new NotFoundException('Supervisor profile not found');
    }

    return { supervisorId: supervisor.id };
  }

  private parseTime(value: string) {
    const isValid = /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);

    if (!isValid) {
      throw new BadRequestException('Time must use HH:mm format');
    }

    return new Date(`1970-01-01T${value}:00.000Z`);
  }
}

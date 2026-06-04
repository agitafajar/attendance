import { PrismaClient, RoleName } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const [adminRole, supervisorRole, employeeRole] = await Promise.all([
    prisma.role.upsert({
      where: { name: RoleName.ADMIN },
      update: {},
      create: { name: RoleName.ADMIN, description: 'System administrator' },
    }),
    prisma.role.upsert({
      where: { name: RoleName.SUPERVISOR },
      update: {},
      create: { name: RoleName.SUPERVISOR, description: 'Field supervisor' },
    }),
    prisma.role.upsert({
      where: { name: RoleName.EMPLOYEE },
      update: {},
      create: { name: RoleName.EMPLOYEE, description: 'Outsourced employee' },
    }),
  ]);

  if (process.env.INCLUDE_DEMO_DATA !== 'true') {
    console.log({
      message:
        'Seed completed: roles only. Set INCLUDE_DEMO_DATA=true for local demo records.',
      roles: [adminRole.name, supervisorRole.name, employeeRole.name],
    });
    return;
  }

  const demoPassword = process.env.DEMO_PASSWORD ?? 'LocalDemoPassword123!';
  const passwordHash = await bcrypt.hash(demoPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@alihdaya.test' },
    update: { fullName: 'Admin Alih Daya', phone: '081100000001' },
    create: {
      email: 'admin@alihdaya.test',
      fullName: 'Admin Alih Daya',
      passwordHash,
      roleId: adminRole.id,
      phone: '081100000001',
    },
  });

  const supervisorUser = await prisma.user.upsert({
    where: { email: 'supervisor@alihdaya.test' },
    update: { fullName: 'Siti Supervisor', phone: '081100000002' },
    create: {
      email: 'supervisor@alihdaya.test',
      fullName: 'Siti Supervisor',
      passwordHash,
      roleId: supervisorRole.id,
      phone: '081100000002',
    },
  });

  const employeeUser = await prisma.user.upsert({
    where: { email: 'employee@alihdaya.test' },
    update: { fullName: 'Budi Santoso', phone: '081100000003' },
    create: {
      email: 'employee@alihdaya.test',
      fullName: 'Budi Santoso',
      passwordHash,
      roleId: employeeRole.id,
      phone: '081100000003',
    },
  });

  const supervisor = await prisma.supervisor.upsert({
    where: { supervisorNumber: 'SPV-001' },
    update: {},
    create: {
      userId: supervisorUser.id,
      supervisorNumber: 'SPV-001',
    },
  });

  const employee = await prisma.employee.upsert({
    where: { employeeNumber: 'EMP-001' },
    update: {},
    create: {
      userId: employeeUser.id,
      supervisorId: supervisor.id,
      employeeNumber: 'EMP-001',
      position: 'Security Officer',
      joinDate: new Date('2026-01-01'),
      employmentStatus: 'CONTRACT',
    },
  });

  const client = await prisma.client.upsert({
    where: { code: 'CL-001' },
    update: {
      name: 'PT Bank ABC',
      address: 'Jl. Tuanku Dorong Hutagalung No.18, Sibolga',
      contactName: 'Rina Operasional',
      contactPhone: '081100000004',
    },
    create: {
      code: 'CL-001',
      name: 'PT Bank ABC',
      address: 'Jl. Tuanku Dorong Hutagalung No.18, Sibolga',
      contactName: 'Rina Operasional',
      contactPhone: '081100000004',
    },
  });

  const location = await prisma.workLocation.upsert({
    where: {
      clientId_name: {
        clientId: client.id,
        name: 'Cabang Medan',
      },
    },
    update: {
      address: 'Jl. Tuanku Dorong Hutagalung No.18, Sibolga',
      latitude: 1.7403745,
      longitude: 98.7827981,
      geofenceRadiusMeter: 150,
    },
    create: {
      clientId: client.id,
      name: 'Cabang Medan',
      address: 'Jl. Tuanku Dorong Hutagalung No.18, Sibolga',
      latitude: 1.7403745,
      longitude: 98.7827981,
      geofenceRadiusMeter: 150,
    },
  });

  const shift = await prisma.shift.upsert({
    where: { code: 'SHIFT-PAGI' },
    update: {
      name: 'Shift Pagi',
      startTime: new Date('1970-01-01T08:00:00.000Z'),
      endTime: new Date('1970-01-01T17:00:00.000Z'),
      gracePeriodMinutes: 10,
    },
    create: {
      code: 'SHIFT-PAGI',
      name: 'Shift Pagi',
      startTime: new Date('1970-01-01T08:00:00.000Z'),
      endTime: new Date('1970-01-01T17:00:00.000Z'),
      gracePeriodMinutes: 10,
    },
  });

  await prisma.employeeAssignment.upsert({
    where: {
      employeeId_clientId_workLocationId_shiftId_startDate: {
        employeeId: employee.id,
        clientId: client.id,
        workLocationId: location.id,
        shiftId: shift.id,
        startDate: new Date('2026-01-01'),
      },
    },
    update: {},
    create: {
      employeeId: employee.id,
      clientId: client.id,
      workLocationId: location.id,
      shiftId: shift.id,
      startDate: new Date('2026-01-01'),
      isActive: true,
    },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existingLeave = await prisma.leaveRequest.findFirst({
    where: {
      employeeId: employee.id,
      startDate: today,
      type: 'SICK',
      deletedAt: null,
    },
  });

  if (!existingLeave) {
    await prisma.leaveRequest.create({
      data: {
        employeeId: employee.id,
        type: 'SICK',
        startDate: today,
        endDate: today,
        reason: 'Demo pengajuan sakit untuk antrian approval supervisor.',
        status: 'SUBMITTED',
      },
    });
  }

  const existingActivity = await prisma.dailyActivity.findFirst({
    where: {
      employeeId: employee.id,
      activityDate: today,
      title: 'Patroli area lobby',
      deletedAt: null,
    },
  });

  if (!existingActivity) {
    await prisma.dailyActivity.create({
      data: {
        employeeId: employee.id,
        activityDate: today,
        title: 'Patroli area lobby',
        description:
          'Melakukan patroli area lobby, pengecekan akses tamu, dan memastikan kondisi area aman.',
        latitude: 1.7403745,
        longitude: 98.7827981,
        status: 'SUBMITTED',
      },
    });
  }

  console.log({
    message: 'Seed completed with demo data',
    adminEmail: admin.email,
    supervisorEmail: supervisorUser.email,
    employeeEmail: employeeUser.email,
    password: demoPassword,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

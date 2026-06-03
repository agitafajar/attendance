const { PrismaClient, RoleName } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const roleDescriptions = {
  ADMIN: 'System administrator',
  SUPERVISOR: 'Supervisor',
  EMPLOYEE: 'Employee',
};

function requireEnv(name) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is required`);
  }

  return value;
}

function optionalEnv(name) {
  const value = process.env[name]?.trim();
  return value || undefined;
}

function parseRole(value) {
  const role = value.toUpperCase();

  if (!Object.values(RoleName).includes(role)) {
    throw new Error('USER_ROLE must be ADMIN, SUPERVISOR, or EMPLOYEE');
  }

  return role;
}

function validateEmail(email) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('USER_EMAIL must be a valid email address');
  }
}

function validatePassword(password) {
  if (password.length < 12) {
    throw new Error('USER_PASSWORD must be at least 12 characters');
  }

  if (
    !/[a-z]/.test(password) ||
    !/[A-Z]/.test(password) ||
    !/\d/.test(password)
  ) {
    throw new Error(
      'USER_PASSWORD must include lowercase, uppercase, and number characters',
    );
  }
}

function defaultNumber(prefix) {
  return `${prefix}-${Date.now()}`;
}

async function findSupervisorId() {
  const supervisorId = optionalEnv('SUPERVISOR_ID');

  if (supervisorId) {
    return supervisorId;
  }

  const supervisorEmail = optionalEnv('SUPERVISOR_EMAIL')?.toLowerCase();

  if (!supervisorEmail) {
    return undefined;
  }

  const supervisor = await prisma.supervisor.findFirst({
    where: {
      deletedAt: null,
      user: { email: supervisorEmail, deletedAt: null },
    },
    select: { id: true },
  });

  if (!supervisor) {
    throw new Error(`Supervisor with email ${supervisorEmail} was not found`);
  }

  return supervisor.id;
}

async function ensureRole(roleName) {
  return prisma.role.upsert({
    where: { name: roleName },
    update: {},
    create: {
      name: roleName,
      description: roleDescriptions[roleName],
    },
  });
}

async function ensureRoleProfile(userId, roleName) {
  if (roleName === RoleName.SUPERVISOR) {
    const supervisorNumber =
      optionalEnv('SUPERVISOR_NUMBER') ?? defaultNumber('SUP');

    return prisma.supervisor.upsert({
      where: { userId },
      update: { supervisorNumber, deletedAt: null },
      create: { userId, supervisorNumber },
      select: { id: true, supervisorNumber: true },
    });
  }

  if (roleName === RoleName.EMPLOYEE) {
    const employeeNumber =
      optionalEnv('EMPLOYEE_NUMBER') ?? defaultNumber('EMP');
    const supervisorId = await findSupervisorId();

    return prisma.employee.upsert({
      where: { userId },
      update: {
        employeeNumber,
        supervisorId,
        position: optionalEnv('EMPLOYEE_POSITION'),
        employmentStatus: optionalEnv('EMPLOYMENT_STATUS') ?? 'ACTIVE',
        deletedAt: null,
      },
      create: {
        userId,
        employeeNumber,
        supervisorId,
        position: optionalEnv('EMPLOYEE_POSITION'),
        employmentStatus: optionalEnv('EMPLOYMENT_STATUS') ?? 'ACTIVE',
      },
      select: {
        id: true,
        employeeNumber: true,
        supervisorId: true,
        position: true,
        employmentStatus: true,
      },
    });
  }

  return undefined;
}

async function main() {
  const roleName = parseRole(requireEnv('USER_ROLE'));
  const email = requireEnv('USER_EMAIL').toLowerCase();
  const password = requireEnv('USER_PASSWORD');
  const fullName = optionalEnv('USER_FULL_NAME') ?? email;
  const phone = optionalEnv('USER_PHONE');
  const shouldUpdatePassword = process.env.USER_UPDATE_PASSWORD === 'true';

  validateEmail(email);
  validatePassword(password);

  const role = await ensureRole(roleName);
  const existingUser = await prisma.user.findUnique({
    where: { email },
    include: { role: true },
  });
  const passwordHash = await bcrypt.hash(password, 12);

  if (existingUser && existingUser.role.name !== roleName) {
    throw new Error(
      `User ${email} already exists with role ${existingUser.role.name}`,
    );
  }

  const user = existingUser
    ? await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          fullName,
          phone,
          passwordHash: shouldUpdatePassword ? passwordHash : undefined,
          isActive: true,
          deletedAt: null,
          refreshTokenHash: null,
          roleId: role.id,
        },
        select: {
          id: true,
          email: true,
          fullName: true,
          isActive: true,
          role: { select: { name: true } },
        },
      })
    : await prisma.user.create({
        data: {
          email,
          fullName,
          phone,
          passwordHash,
          roleId: role.id,
        },
        select: {
          id: true,
          email: true,
          fullName: true,
          isActive: true,
          role: { select: { name: true } },
        },
      });

  const profile = await ensureRoleProfile(user.id, roleName);

  console.log({
    message: existingUser
      ? shouldUpdatePassword
        ? 'User updated and password refreshed successfully'
        : 'User already exists. Profile was ensured. Set USER_UPDATE_PASSWORD=true to update the password.'
      : 'User created successfully',
    user,
    profile,
  });
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

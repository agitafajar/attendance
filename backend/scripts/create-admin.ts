import { PrismaClient, RoleName } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

function requireEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is required`);
  }

  return value;
}

function validateEmail(email: string) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('ADMIN_EMAIL must be a valid email address');
  }
}

function validatePassword(password: string) {
  if (password.length < 12) {
    throw new Error('ADMIN_PASSWORD must be at least 12 characters');
  }

  if (
    !/[a-z]/.test(password) ||
    !/[A-Z]/.test(password) ||
    !/\d/.test(password)
  ) {
    throw new Error(
      'ADMIN_PASSWORD must include lowercase, uppercase, and number characters',
    );
  }
}

async function main() {
  const email = requireEnv('ADMIN_EMAIL').toLowerCase();
  const password = requireEnv('ADMIN_PASSWORD');
  const fullName = process.env.ADMIN_FULL_NAME?.trim() || 'Production Admin';
  const phone = process.env.ADMIN_PHONE?.trim() || undefined;
  const shouldUpdatePassword = process.env.ADMIN_UPDATE_PASSWORD === 'true';

  validateEmail(email);
  validatePassword(password);

  const adminRole = await prisma.role.upsert({
    where: { name: RoleName.ADMIN },
    update: {},
    create: { name: RoleName.ADMIN, description: 'System administrator' },
  });

  const existingUser = await prisma.user.findUnique({
    where: { email },
    include: { role: true },
  });

  const passwordHash = await bcrypt.hash(password, 12);

  if (existingUser) {
    if (existingUser.role.name !== RoleName.ADMIN) {
      throw new Error(
        `User ${email} already exists with role ${existingUser.role.name}`,
      );
    }

    if (!shouldUpdatePassword) {
      console.log({
        message:
          'Admin already exists. Set ADMIN_UPDATE_PASSWORD=true to update the password and reactivate it.',
        email,
      });
      return;
    }

    const user = await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        fullName,
        phone,
        passwordHash,
        isActive: true,
        deletedAt: null,
        refreshTokenHash: null,
        roleId: adminRole.id,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        isActive: true,
      },
    });

    console.log({
      message: 'Admin password updated successfully',
      user,
    });
    return;
  }

  const user = await prisma.user.create({
    data: {
      email,
      fullName,
      phone,
      passwordHash,
      roleId: adminRole.id,
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      isActive: true,
    },
  });

  console.log({
    message: 'Admin created successfully',
    user,
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

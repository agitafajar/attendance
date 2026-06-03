import { Injectable, NotFoundException } from '@nestjs/common';
import { RoleName } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findFirst({
      where: { email, deletedAt: null },
      include: { role: true },
    });
  }

  findById(id: string) {
    return this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: { role: true, employee: true, supervisor: true },
    });
  }

  async create(dto: CreateUserDto) {
    const role = await this.prisma.role.findUnique({
      where: { name: dto.role },
    });

    if (!role) {
      throw new NotFoundException(`Role ${dto.role} not found`);
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        fullName: dto.fullName,
        phone: dto.phone,
        passwordHash,
        roleId: role.id,
      },
      include: { role: true },
    });

    return this.toPublicUser(user);
  }

  async list(role?: RoleName) {
    const users = await this.prisma.user.findMany({
      where: {
        deletedAt: null,
        role: role ? { name: role } : undefined,
      },
      include: { role: true },
      orderBy: { createdAt: 'desc' },
    });

    return users.map((user) => this.toPublicUser(user));
  }

  toPublicUser<
    T extends { passwordHash?: string; refreshTokenHash?: string | null },
  >(user: T) {
    const {
      passwordHash: _passwordHash,
      refreshTokenHash: _refreshTokenHash,
      ...safeUser
    } = user;
    return safeUser;
  }
}

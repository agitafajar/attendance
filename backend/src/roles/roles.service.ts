import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.role.findMany({ orderBy: { name: 'asc' } });
  }

  create(dto: CreateRoleDto) {
    return this.prisma.role.create({ data: dto });
  }
}

import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RoleName } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { ListLeaveRequestQueryDto } from './dto/list-leave-request-query.dto';
import { LeaveService } from './leave.service';

@ApiTags('Leave Requests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('leave-requests')
export class LeaveController {
  constructor(private readonly leaveService: LeaveService) {}

  @Post()
  @Roles(RoleName.EMPLOYEE)
  create(@CurrentUser() user: JwtUser, @Body() dto: CreateLeaveRequestDto) {
    return this.leaveService.create(user, dto);
  }

  @Get('me')
  @Roles(RoleName.EMPLOYEE)
  getMine(
    @CurrentUser() user: JwtUser,
    @Query() query: ListLeaveRequestQueryDto,
  ) {
    return this.leaveService.getMine(user, query);
  }

  @Get()
  @Roles(RoleName.ADMIN, RoleName.SUPERVISOR, RoleName.EMPLOYEE)
  list(@CurrentUser() user: JwtUser, @Query() query: ListLeaveRequestQueryDto) {
    return this.leaveService.list(user, query);
  }

  @Get(':id')
  @Roles(RoleName.ADMIN, RoleName.SUPERVISOR, RoleName.EMPLOYEE)
  findOne(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.leaveService.findOne(user, id);
  }

  @Post(':id/cancel')
  @Roles(RoleName.EMPLOYEE)
  cancel(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.leaveService.cancel(user, id);
  }
}

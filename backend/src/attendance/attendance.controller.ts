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
import { AttendanceService } from './attendance.service';
import { CheckInDto } from './dto/check-in.dto';
import { CheckOutDto } from './dto/check-out.dto';
import { ListAttendanceQueryDto } from './dto/list-attendance-query.dto';

@ApiTags('Attendance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('attendances')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('check-in')
  @Roles(RoleName.EMPLOYEE)
  checkIn(@CurrentUser() user: JwtUser, @Body() dto: CheckInDto) {
    return this.attendanceService.checkIn(user, dto);
  }

  @Post('check-out')
  @Roles(RoleName.EMPLOYEE)
  checkOut(@CurrentUser() user: JwtUser, @Body() dto: CheckOutDto) {
    return this.attendanceService.checkOut(user, dto);
  }

  @Get('me/today')
  @Roles(RoleName.EMPLOYEE)
  getMyTodayAttendance(@CurrentUser() user: JwtUser) {
    return this.attendanceService.getMine(user);
  }

  @Get('me')
  @Roles(RoleName.EMPLOYEE)
  getMyAttendanceByDate(
    @CurrentUser() user: JwtUser,
    @Query('date') date?: string,
  ) {
    return this.attendanceService.getMine(user, date);
  }

  @Get()
  @Roles(RoleName.ADMIN, RoleName.SUPERVISOR, RoleName.EMPLOYEE)
  list(@CurrentUser() user: JwtUser, @Query() query: ListAttendanceQueryDto) {
    return this.attendanceService.list(user, query);
  }

  @Get(':id')
  @Roles(RoleName.ADMIN, RoleName.SUPERVISOR, RoleName.EMPLOYEE)
  findOne(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.attendanceService.findOne(user, id);
  }
}

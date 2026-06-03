import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
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
import { DailyActivityService } from './daily-activity.service';
import { CreateDailyActivityDto } from './dto/create-daily-activity.dto';
import { ListDailyActivityQueryDto } from './dto/list-daily-activity-query.dto';
import { UpdateDailyActivityDto } from './dto/update-daily-activity.dto';

@ApiTags('Daily Activities')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('daily-activities')
export class DailyActivityController {
  constructor(private readonly dailyActivityService: DailyActivityService) {}

  @Post()
  @Roles(RoleName.EMPLOYEE)
  create(@CurrentUser() user: JwtUser, @Body() dto: CreateDailyActivityDto) {
    return this.dailyActivityService.create(user, dto);
  }

  @Get('me/today')
  @Roles(RoleName.EMPLOYEE)
  getMyTodayActivities(@CurrentUser() user: JwtUser) {
    return this.dailyActivityService.getMine(user);
  }

  @Get('me')
  @Roles(RoleName.EMPLOYEE)
  getMyActivitiesByDate(
    @CurrentUser() user: JwtUser,
    @Query('date') date?: string,
  ) {
    return this.dailyActivityService.getMine(user, date);
  }

  @Get()
  @Roles(RoleName.ADMIN, RoleName.SUPERVISOR, RoleName.EMPLOYEE)
  list(
    @CurrentUser() user: JwtUser,
    @Query() query: ListDailyActivityQueryDto,
  ) {
    return this.dailyActivityService.list(user, query);
  }

  @Get(':id')
  @Roles(RoleName.ADMIN, RoleName.SUPERVISOR, RoleName.EMPLOYEE)
  findOne(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.dailyActivityService.findOne(user, id);
  }

  @Patch(':id')
  @Roles(RoleName.EMPLOYEE)
  update(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() dto: UpdateDailyActivityDto,
  ) {
    return this.dailyActivityService.update(user, id, dto);
  }

  @Post(':id/submit')
  @Roles(RoleName.EMPLOYEE)
  submit(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.dailyActivityService.submit(user, id);
  }

  @Delete(':id')
  @Roles(RoleName.EMPLOYEE)
  remove(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.dailyActivityService.remove(user, id);
  }
}

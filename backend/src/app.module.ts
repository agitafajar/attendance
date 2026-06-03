import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ApprovalModule } from './approval/approval.module';
import { AttendanceModule } from './attendance/attendance.module';
import { AuthModule } from './auth/auth.module';
import { DailyActivityModule } from './daily-activity/daily-activity.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { LeaveModule } from './leave/leave.module';
import { MasterDataModule } from './master-data/master-data.module';
import { PrismaModule } from './prisma/prisma.module';
import { ReportModule } from './report/report.module';
import { RolesModule } from './roles/roles.module';
import { UploadModule } from './upload/upload.module';
import { UsersModule } from './users/users.module';
import { validateEnv } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    ThrottlerModule.forRoot([
      {
        ttl: Number(process.env.RATE_LIMIT_TTL ?? 60) * 1000,
        limit: Number(process.env.RATE_LIMIT_LIMIT ?? 120),
      },
    ]),
    PrismaModule,
    AuthModule,
    UsersModule,
    RolesModule,
    AttendanceModule,
    DailyActivityModule,
    ApprovalModule,
    LeaveModule,
    MasterDataModule,
    DashboardModule,
    ReportModule,
    UploadModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}

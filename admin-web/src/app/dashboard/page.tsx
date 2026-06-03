"use client";

import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  CalendarCheck,
  ClipboardCheck,
  Clock,
  NotebookTabs,
  Users,
} from "lucide-react";
import { api } from "@/lib/api";
import { type RoleName } from "@/lib/auth-storage";
import { AdminShell } from "@/components/app/admin-shell";
import { useAuthGuard } from "@/components/app/use-auth-guard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type AdminDashboard = {
  totalEmployees: number;
  presentToday: number;
  late: number;
  absent: number;
  leave: number;
  activityStatistics: {
    totalToday: number;
    submitted: number;
    approved: number;
    rejected: number;
  };
};

type SupervisorDashboard = {
  totalEmployees: number;
  pendingAttendance: number;
  pendingActivities: number;
  pendingLeaves: number;
};

type EmployeeDashboard = {
  employee: {
    employeeNumber: string;
    position?: string | null;
    user: {
      fullName: string;
      email: string;
    };
  };
  myAttendance?: {
    status: string;
    checkInTime?: string | null;
    checkOutTime?: string | null;
    lateMinutes?: number | null;
    workMinutes?: number | null;
  } | null;
  myActivities: Array<{
    id: string;
    title: string;
    status: string;
  }>;
  myLeaveRequests: Array<{
    id: string;
    type: string;
    status: string;
  }>;
};

type DashboardResponse = AdminDashboard | SupervisorDashboard | EmployeeDashboard;

const endpointByRole: Record<RoleName, string> = {
  ADMIN: "/dashboard/admin",
  SUPERVISOR: "/dashboard/supervisor",
  EMPLOYEE: "/dashboard/employee",
};

export default function DashboardPage() {
  const { user, isReady } = useAuthGuard();
  const role = user?.role?.name;

  const dashboardQuery = useQuery({
    queryKey: ["dashboard", role],
    queryFn: async () => {
      if (!role) {
        throw new Error("Role not available");
      }

      const { data } = await api.get<DashboardResponse>(endpointByRole[role]);
      return data;
    },
    enabled: isReady && Boolean(role),
  });

  return (
    <AdminShell
      title="Dashboard"
      description="Ringkasan operasional absensi dan kegiatan hari ini."
      user={user}
    >
      {dashboardQuery.isError ? (
        <Card className="border-red-200">
          <CardContent className="pt-6 text-sm text-red-600">
            Gagal memuat dashboard. Silakan login ulang atau hubungi admin.
          </CardContent>
        </Card>
      ) : null}

      {role === "ADMIN" ? (
        <AdminDashboardView dashboard={dashboardQuery.data as AdminDashboard | undefined} />
      ) : null}

      {role === "SUPERVISOR" ? (
        <SupervisorDashboardView
          dashboard={dashboardQuery.data as SupervisorDashboard | undefined}
        />
      ) : null}

      {role === "EMPLOYEE" ? (
        <EmployeeDashboardView
          dashboard={dashboardQuery.data as EmployeeDashboard | undefined}
        />
      ) : null}
    </AdminShell>
  );
}

function AdminDashboardView({ dashboard }: { dashboard?: AdminDashboard }) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Employees"
          value={dashboard?.totalEmployees}
          icon={<Users className="h-5 w-5" />}
        />
        <MetricCard
          title="Present Today"
          value={dashboard?.presentToday}
          icon={<CalendarCheck className="h-5 w-5" />}
        />
        <MetricCard
          title="Late"
          value={dashboard?.late}
          icon={<Clock className="h-5 w-5" />}
        />
        <MetricCard
          title="Absent"
          value={dashboard?.absent}
          icon={<AlertTriangle className="h-5 w-5" />}
        />
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Activity Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-4">
            <SmallStat label="Total Today" value={dashboard?.activityStatistics.totalToday} />
            <SmallStat label="Submitted" value={dashboard?.activityStatistics.submitted} />
            <SmallStat label="Approved" value={dashboard?.activityStatistics.approved} />
            <SmallStat label="Rejected" value={dashboard?.activityStatistics.rejected} />
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function SupervisorDashboardView({ dashboard }: { dashboard?: SupervisorDashboard }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Team Employees"
        value={dashboard?.totalEmployees}
        icon={<Users className="h-5 w-5" />}
      />
      <MetricCard
        title="Pending Attendance"
        value={dashboard?.pendingAttendance}
        icon={<ClipboardCheck className="h-5 w-5" />}
      />
      <MetricCard
        title="Pending Activities"
        value={dashboard?.pendingActivities}
        icon={<Activity className="h-5 w-5" />}
      />
      <MetricCard
        title="Pending Leaves"
        value={dashboard?.pendingLeaves}
        icon={<NotebookTabs className="h-5 w-5" />}
      />
    </div>
  );
}

function EmployeeDashboardView({ dashboard }: { dashboard?: EmployeeDashboard }) {
  const attendance = dashboard?.myAttendance;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Attendance Status"
          valueText={attendance?.status ?? "No attendance"}
          icon={<CalendarCheck className="h-5 w-5" />}
        />
        <MetricCard
          title="Late Minutes"
          value={attendance?.lateMinutes ?? 0}
          icon={<Clock className="h-5 w-5" />}
        />
        <MetricCard
          title="Activities Today"
          value={dashboard?.myActivities.length}
          icon={<Activity className="h-5 w-5" />}
        />
        <MetricCard
          title="Recent Leaves"
          value={dashboard?.myLeaveRequests.length}
          icon={<NotebookTabs className="h-5 w-5" />}
        />
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>My Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 text-sm sm:grid-cols-3">
            <SmallStat label="Name" valueText={dashboard?.employee.user.fullName} />
            <SmallStat label="Employee No" valueText={dashboard?.employee.employeeNumber} />
            <SmallStat label="Position" valueText={dashboard?.employee.position ?? "-"} />
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function MetricCard({
  title,
  value,
  valueText,
  icon,
}: {
  title: string;
  value?: number;
  valueText?: string;
  icon: ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-neutral-500">{title}</CardTitle>
        <div className="text-neutral-500">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{valueText ?? value ?? "-"}</div>
      </CardContent>
    </Card>
  );
}

function SmallStat({
  label,
  value,
  valueText,
}: {
  label: string;
  value?: number;
  valueText?: string;
}) {
  return (
    <div className="rounded-md border border-neutral-200 p-3">
      <p className="text-sm text-neutral-500">{label}</p>
      <p className="mt-1 text-xl font-semibold">{valueText ?? value ?? "-"}</p>
    </div>
  );
}

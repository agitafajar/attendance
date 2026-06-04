"use client";

import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  CalendarCheck,
  ClipboardCheck,
  Clock,
  Server,
  NotebookTabs,
  ShieldCheck,
  Users,
} from "lucide-react";
import { api } from "@/lib/api";
import { type RoleName } from "@/lib/auth-storage";
import { AdminShell } from "@/components/app/admin-shell";
import { useAuthGuard } from "@/components/app/use-auth-guard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardSkeleton, QueryErrorState } from "@/components/ui/table-state";

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

type HealthResponse = {
  name: string;
  status: string;
  version?: string;
  environment?: string;
  checkedAt?: string;
};

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

  const healthQuery = useQuery({
    queryKey: ["api-health"],
    queryFn: async () => {
      const { data } = await api.get<HealthResponse>("/");
      return data;
    },
    enabled: isReady && role === "ADMIN",
    staleTime: 60_000,
  });

  return (
    <AdminShell
      title="Dashboard"
      description="Ringkasan operasional absensi dan kegiatan hari ini."
      user={user}
    >
      {dashboardQuery.isError ? (
        <QueryErrorState
          title="Dashboard gagal dimuat"
          description="Ringkasan operasional belum bisa ditampilkan. Coba muat ulang atau login ulang jika sesi habis."
          onRetry={() => dashboardQuery.refetch()}
        />
      ) : null}

      {dashboardQuery.isLoading ? <DashboardSkeleton /> : null}

      {!dashboardQuery.isLoading && !dashboardQuery.isError && role === "ADMIN" ? (
        <AdminDashboardView
          dashboard={dashboardQuery.data as AdminDashboard | undefined}
          health={healthQuery.data}
          isHealthLoading={healthQuery.isLoading}
          isHealthError={healthQuery.isError}
          onRefreshHealth={() => healthQuery.refetch()}
        />
      ) : null}

      {!dashboardQuery.isLoading && !dashboardQuery.isError && role === "SUPERVISOR" ? (
        <SupervisorDashboardView
          dashboard={dashboardQuery.data as SupervisorDashboard | undefined}
        />
      ) : null}

      {!dashboardQuery.isLoading && !dashboardQuery.isError && role === "EMPLOYEE" ? (
        <EmployeeDashboardView
          dashboard={dashboardQuery.data as EmployeeDashboard | undefined}
        />
      ) : null}
    </AdminShell>
  );
}

function AdminDashboardView({
  dashboard,
  health,
  isHealthLoading,
  isHealthError,
  onRefreshHealth,
}: {
  dashboard?: AdminDashboard;
  health?: HealthResponse;
  isHealthLoading: boolean;
  isHealthError: boolean;
  onRefreshHealth: () => void;
}) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Employees"
          value={dashboard?.totalEmployees}
          icon={<Users className="h-5 w-5" />}
          tone="charcoal"
        />
        <MetricCard
          title="Present Today"
          value={dashboard?.presentToday}
          icon={<CalendarCheck className="h-5 w-5" />}
          tone="green"
        />
        <MetricCard
          title="Late"
          value={dashboard?.late}
          icon={<Clock className="h-5 w-5" />}
          tone="amber"
        />
        <MetricCard
          title="Absent"
          value={dashboard?.absent}
          icon={<AlertTriangle className="h-5 w-5" />}
          tone="rose"
        />
      </div>

      <Card className="mt-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base text-[var(--foreground)]">
              Activity Statistics
            </CardTitle>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Status kegiatan harian yang tercatat hari ini.
            </p>
          </div>
          <div className="hidden h-10 w-10 items-center justify-center rounded-md bg-[var(--brand-950)] text-[var(--brand-500)] sm:flex">
            <Activity className="h-5 w-5" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-4">
            <SmallStat
              label="Total Today"
              value={dashboard?.activityStatistics.totalToday}
            />
            <SmallStat
              label="Submitted"
              value={dashboard?.activityStatistics.submitted}
            />
            <SmallStat
              label="Approved"
              value={dashboard?.activityStatistics.approved}
            />
            <SmallStat
              label="Rejected"
              value={dashboard?.activityStatistics.rejected}
            />
          </div>
        </CardContent>
      </Card>

      <SystemHealthCard
        health={health}
        isLoading={isHealthLoading}
        isError={isHealthError}
        onRefresh={onRefreshHealth}
      />
    </>
  );
}

function SystemHealthCard({
  health,
  isLoading,
  isError,
  onRefresh,
}: {
  health?: HealthResponse;
  isLoading: boolean;
  isError: boolean;
  onRefresh: () => void;
}) {
  const checkedAt = health?.checkedAt
    ? new Intl.DateTimeFormat("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(health.checkedAt))
    : "-";

  return (
    <Card className="mt-4 border-[var(--border)] bg-[var(--surface)]">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base text-[var(--foreground)]">
            System Health
          </CardTitle>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Status backend API yang sedang digunakan dashboard.
          </p>
        </div>
        <div className="hidden h-10 w-10 items-center justify-center rounded-md bg-[var(--brand-950)] text-[var(--brand-500)] sm:flex">
          <Server className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 text-sm sm:grid-cols-4">
          <SmallStat
            label="Status"
            valueText={isLoading ? "Checking..." : isError ? "Error" : health?.status ?? "-"}
          />
          <SmallStat label="Version" valueText={health?.version ?? "-"} />
          <SmallStat label="Environment" valueText={health?.environment ?? "-"} />
          <SmallStat label="Checked At" valueText={checkedAt} />
        </div>
        <Button
          variant="outline"
          className="mt-4 h-9"
          onClick={onRefresh}
          disabled={isLoading}
        >
          Refresh Health
        </Button>
      </CardContent>
    </Card>
  );
}

function SupervisorDashboardView({ dashboard }: { dashboard?: SupervisorDashboard }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Team Employees"
        value={dashboard?.totalEmployees}
        icon={<Users className="h-5 w-5" />}
        tone="charcoal"
      />
      <MetricCard
        title="Pending Attendance"
        value={dashboard?.pendingAttendance}
        icon={<ClipboardCheck className="h-5 w-5" />}
        tone="amber"
      />
      <MetricCard
        title="Pending Activities"
        value={dashboard?.pendingActivities}
        icon={<Activity className="h-5 w-5" />}
        tone="green"
      />
      <MetricCard
        title="Pending Leaves"
        value={dashboard?.pendingLeaves}
        icon={<NotebookTabs className="h-5 w-5" />}
        tone="teal"
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
          tone="green"
        />
        <MetricCard
          title="Late Minutes"
          value={attendance?.lateMinutes ?? 0}
          icon={<Clock className="h-5 w-5" />}
          tone="amber"
        />
        <MetricCard
          title="Activities Today"
          value={dashboard?.myActivities.length}
          icon={<Activity className="h-5 w-5" />}
          tone="teal"
        />
        <MetricCard
          title="Recent Leaves"
          value={dashboard?.myLeaveRequests.length}
          icon={<NotebookTabs className="h-5 w-5" />}
          tone="charcoal"
        />
      </div>

      <Card className="mt-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base text-[var(--foreground)]">My Profile</CardTitle>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Identitas karyawan aktif untuk sesi ini.
            </p>
          </div>
          <div className="hidden h-10 w-10 items-center justify-center rounded-md bg-[var(--brand-950)] text-[var(--brand-500)] sm:flex">
            <ShieldCheck className="h-5 w-5" />
          </div>
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
  tone = "charcoal",
}: {
  title: string;
  value?: number;
  valueText?: string;
  icon: ReactNode;
  tone?: "charcoal" | "green" | "amber" | "rose" | "teal";
}) {
  const tones = {
    charcoal: {
      card: "border-[var(--border)] bg-[var(--surface)]",
      icon: "bg-[var(--brand-950)] text-white",
      accent: "text-[var(--foreground)]",
    },
    green: {
      card: "border-emerald-200 bg-emerald-50/60",
      icon: "bg-emerald-600 text-white",
      accent: "text-emerald-800",
    },
    amber: {
      card: "border-amber-200 bg-amber-50/70",
      icon: "bg-amber-500 text-white",
      accent: "text-amber-800",
    },
    rose: {
      card: "border-red-200 bg-red-50/70",
      icon: "bg-red-600 text-white",
      accent: "text-red-800",
    },
    teal: {
      card: "border-teal-200 bg-teal-50/70",
      icon: "bg-[var(--brand-700)] text-white",
      accent: "text-[var(--brand-700)]",
    },
  }[tone];

  return (
    <Card
      className={`overflow-hidden ${tones.card}`}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-semibold text-[var(--muted-strong)]">
          {title}
        </CardTitle>
        <div className={`flex h-10 w-10 items-center justify-center rounded-md ${tones.icon}`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-semibold tracking-normal ${tones.accent}`}>
          {valueText ?? value ?? "-"}
        </div>
        <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-[var(--muted)]">
          <ArrowUpRight className="h-3.5 w-3.5" />
          Real-time summary
        </div>
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
    <div className="rounded-md border border-[var(--border)] bg-[#fbfcfb] p-3">
      <p className="text-sm font-medium text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-xl font-semibold text-[var(--foreground)]">
        {valueText ?? value ?? "-"}
      </p>
    </div>
  );
}

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ClipboardCheck, X } from "lucide-react";
import { AdminShell } from "@/components/app/admin-shell";
import { useAuthGuard } from "@/components/app/use-auth-guard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";

const APPROVAL_ROLES = ["ADMIN", "SUPERVISOR"] as const;

type PendingAttendance = {
  id: string;
  attendanceDate: string;
  status: string;
  lateMinutes?: number | null;
  employee: {
    employeeNumber: string;
    user: {
      fullName: string;
    };
  };
  assignment: {
    client: {
      name: string;
    };
    workLocation: {
      name: string;
    };
  };
};

type PendingActivity = {
  id: string;
  activityDate: string;
  title: string;
  status: string;
  employee: {
    employeeNumber: string;
    user: {
      fullName: string;
    };
  };
};

type PendingLeave = {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
  employee: {
    employeeNumber: string;
    user: {
      fullName: string;
    };
  };
};

type ApprovalTarget = "attendance" | "activity" | "leave";

export default function ApprovalsPage() {
  const queryClient = useQueryClient();
  const { user, isReady } = useAuthGuard({ allowedRoles: APPROVAL_ROLES });

  const attendancesQuery = useQuery({
    queryKey: ["approvals", "attendances"],
    queryFn: async () => {
      const { data } = await api.get<PendingAttendance[]>(
        "/approvals/attendances/pending",
      );
      return data;
    },
    enabled: isReady,
  });

  const activitiesQuery = useQuery({
    queryKey: ["approvals", "daily-activities"],
    queryFn: async () => {
      const { data } = await api.get<PendingActivity[]>(
        "/approvals/daily-activities/pending",
      );
      return data;
    },
    enabled: isReady,
  });

  const leavesQuery = useQuery({
    queryKey: ["approvals", "leave-requests"],
    queryFn: async () => {
      const { data } = await api.get<PendingLeave[]>(
        "/approvals/leave-requests/pending",
      );
      return data;
    },
    enabled: isReady,
  });

  const actionMutation = useMutation({
    mutationFn: async ({
      target,
      id,
      action,
      notes,
    }: {
      target: ApprovalTarget;
      id: string;
      action: "approve" | "reject";
      notes?: string;
    }) => {
      const pathMap = {
        attendance: "attendances",
        activity: "daily-activities",
        leave: "leave-requests",
      };

      const { data } = await api.post(
        `/approvals/${pathMap[target]}/${id}/${action}`,
        notes ? { notes } : {},
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approvals"] });
    },
  });

  function approve(target: ApprovalTarget, id: string) {
    actionMutation.mutate({ target, id, action: "approve", notes: "Approved" });
  }

  function reject(target: ApprovalTarget, id: string) {
    const notes = window.prompt("Catatan penolakan");

    if (!notes) {
      return;
    }

    actionMutation.mutate({ target, id, action: "reject", notes });
  }

  return (
    <AdminShell
      title="Approvals"
      description="Review dan proses approval absensi, aktivitas, dan izin."
      user={user}
    >
      <div className="space-y-4">
        <ApprovalSection
          title="Pending Attendance"
          emptyText="Tidak ada absensi pending."
          rows={attendancesQuery.data}
          isLoading={attendancesQuery.isLoading}
          renderRow={(attendance) => (
            <tr key={attendance.id} className="border-b border-neutral-100">
              <td className="py-3 pr-4">{formatDate(attendance.attendanceDate)}</td>
              <td className="py-3 pr-4">
                {attendance.employee.employeeNumber} - {attendance.employee.user.fullName}
              </td>
              <td className="py-3 pr-4">
                {attendance.assignment.client.name} /{" "}
                {attendance.assignment.workLocation.name}
              </td>
              <td className="py-3 pr-4">{attendance.lateMinutes ?? 0} menit</td>
              <td className="py-3 pr-4">{attendance.status}</td>
              <td className="py-3 pr-4">
                <ActionButtons
                  onApprove={() => approve("attendance", attendance.id)}
                  onReject={() => reject("attendance", attendance.id)}
                  disabled={actionMutation.isPending}
                />
              </td>
            </tr>
          )}
          headers={["Tanggal", "Employee", "Lokasi", "Late", "Status", "Aksi"]}
        />

        <ApprovalSection
          title="Pending Activities"
          emptyText="Tidak ada aktivitas pending."
          rows={activitiesQuery.data}
          isLoading={activitiesQuery.isLoading}
          renderRow={(activity) => (
            <tr key={activity.id} className="border-b border-neutral-100">
              <td className="py-3 pr-4">{formatDate(activity.activityDate)}</td>
              <td className="py-3 pr-4">
                {activity.employee.employeeNumber} - {activity.employee.user.fullName}
              </td>
              <td className="py-3 pr-4">{activity.title}</td>
              <td className="py-3 pr-4">{activity.status}</td>
              <td className="py-3 pr-4">
                <ActionButtons
                  onApprove={() => approve("activity", activity.id)}
                  onReject={() => reject("activity", activity.id)}
                  disabled={actionMutation.isPending}
                />
              </td>
            </tr>
          )}
          headers={["Tanggal", "Employee", "Aktivitas", "Status", "Aksi"]}
        />

        <ApprovalSection
          title="Pending Leave Requests"
          emptyText="Tidak ada izin pending."
          rows={leavesQuery.data}
          isLoading={leavesQuery.isLoading}
          renderRow={(leave) => (
            <tr key={leave.id} className="border-b border-neutral-100">
              <td className="py-3 pr-4">
                {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
              </td>
              <td className="py-3 pr-4">
                {leave.employee.employeeNumber} - {leave.employee.user.fullName}
              </td>
              <td className="py-3 pr-4">{leave.type}</td>
              <td className="py-3 pr-4">{leave.reason}</td>
              <td className="py-3 pr-4">{leave.status}</td>
              <td className="py-3 pr-4">
                <ActionButtons
                  onApprove={() => approve("leave", leave.id)}
                  onReject={() => reject("leave", leave.id)}
                  disabled={actionMutation.isPending}
                />
              </td>
            </tr>
          )}
          headers={["Periode", "Employee", "Tipe", "Alasan", "Status", "Aksi"]}
        />
      </div>
    </AdminShell>
  );
}

function ApprovalSection<T>({
  title,
  headers,
  rows,
  isLoading,
  emptyText,
  renderRow,
}: {
  title: string;
  headers: string[];
  rows?: T[];
  isLoading: boolean;
  emptyText: string;
  renderRow: (row: T) => React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-neutral-500">
                {headers.map((header) => (
                  <th key={header} className="py-3 pr-4 font-medium">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows?.map(renderRow)}
              {!isLoading && !rows?.length ? (
                <tr>
                  <td className="py-6 text-neutral-500" colSpan={headers.length}>
                    {emptyText}
                  </td>
                </tr>
              ) : null}
              {isLoading ? (
                <tr>
                  <td className="py-6 text-neutral-500" colSpan={headers.length}>
                    Memuat data...
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function ActionButtons({
  onApprove,
  onReject,
  disabled,
}: {
  onApprove: () => void;
  onReject: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex gap-2">
      <Button className="h-8 px-3" onClick={onApprove} disabled={disabled}>
        <Check className="h-4 w-4" />
        Approve
      </Button>
      <Button className="h-8 px-3" variant="outline" onClick={onReject} disabled={disabled}>
        <X className="h-4 w-4" />
        Reject
      </Button>
    </div>
  );
}

function formatDate(value: string) {
  return value.slice(0, 10);
}

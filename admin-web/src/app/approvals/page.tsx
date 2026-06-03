"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ClipboardCheck, Loader2, X } from "lucide-react";
import { AdminShell } from "@/components/app/admin-shell";
import { useAuthGuard } from "@/components/app/use-auth-guard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
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
type RejectionDraft = {
  target: ApprovalTarget;
  id: string;
  notes: string;
} | null;

export default function ApprovalsPage() {
  const queryClient = useQueryClient();
  const { user, isReady } = useAuthGuard({ allowedRoles: APPROVAL_ROLES });
  const [rejectionDraft, setRejectionDraft] = useState<RejectionDraft>(null);

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
      setRejectionDraft(null);
      queryClient.invalidateQueries({ queryKey: ["approvals"] });
    },
  });

  function approve(target: ApprovalTarget, id: string) {
    actionMutation.mutate({ target, id, action: "approve", notes: "Approved" });
  }

  function openReject(target: ApprovalTarget, id: string) {
    setRejectionDraft({ target, id, notes: "" });
  }

  function submitReject() {
    if (!rejectionDraft?.notes.trim()) {
      return;
    }

    actionMutation.mutate({
      target: rejectionDraft.target,
      id: rejectionDraft.id,
      action: "reject",
      notes: rejectionDraft.notes.trim(),
    });
  }

  function updateRejectNotes(notes: string) {
    setRejectionDraft((current) => (current ? { ...current, notes } : current));
  }

  function isSubmitting(target: ApprovalTarget, id: string) {
    return (
      actionMutation.isPending &&
      actionMutation.variables?.target === target &&
      actionMutation.variables.id === id
    );
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
          total={attendancesQuery.data?.length ?? 0}
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
              <td className="py-3 pr-4">
                <StatusBadge status={attendance.status} />
              </td>
              <td className="py-3 pr-4">
                <ActionButtons
                  onApprove={() => approve("attendance", attendance.id)}
                  onReject={() => openReject("attendance", attendance.id)}
                  onCancelReject={() => setRejectionDraft(null)}
                  onSubmitReject={submitReject}
                  onUpdateRejectNotes={updateRejectNotes}
                  rejectionNotes={rejectionDraft?.notes ?? ""}
                  isRejecting={
                    rejectionDraft?.target === "attendance" &&
                    rejectionDraft.id === attendance.id
                  }
                  isSubmitting={isSubmitting("attendance", attendance.id)}
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
          total={activitiesQuery.data?.length ?? 0}
          renderRow={(activity) => (
            <tr key={activity.id} className="border-b border-neutral-100">
              <td className="py-3 pr-4">{formatDate(activity.activityDate)}</td>
              <td className="py-3 pr-4">
                {activity.employee.employeeNumber} - {activity.employee.user.fullName}
              </td>
              <td className="py-3 pr-4">{activity.title}</td>
              <td className="py-3 pr-4">
                <StatusBadge status={activity.status} />
              </td>
              <td className="py-3 pr-4">
                <ActionButtons
                  onApprove={() => approve("activity", activity.id)}
                  onReject={() => openReject("activity", activity.id)}
                  onCancelReject={() => setRejectionDraft(null)}
                  onSubmitReject={submitReject}
                  onUpdateRejectNotes={updateRejectNotes}
                  rejectionNotes={rejectionDraft?.notes ?? ""}
                  isRejecting={
                    rejectionDraft?.target === "activity" &&
                    rejectionDraft.id === activity.id
                  }
                  isSubmitting={isSubmitting("activity", activity.id)}
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
          total={leavesQuery.data?.length ?? 0}
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
              <td className="py-3 pr-4">
                <StatusBadge status={leave.status} />
              </td>
              <td className="py-3 pr-4">
                <ActionButtons
                  onApprove={() => approve("leave", leave.id)}
                  onReject={() => openReject("leave", leave.id)}
                  onCancelReject={() => setRejectionDraft(null)}
                  onSubmitReject={submitReject}
                  onUpdateRejectNotes={updateRejectNotes}
                  rejectionNotes={rejectionDraft?.notes ?? ""}
                  isRejecting={
                    rejectionDraft?.target === "leave" && rejectionDraft.id === leave.id
                  }
                  isSubmitting={isSubmitting("leave", leave.id)}
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
  total,
  emptyText,
  renderRow,
}: {
  title: string;
  headers: string[];
  rows?: T[];
  isLoading: boolean;
  total: number;
  emptyText: string;
  renderRow: (row: T) => React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4" />
          {title}
        </CardTitle>
        <span className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
          {isLoading ? "Loading" : `${total} Pending`}
        </span>
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
  onCancelReject,
  onSubmitReject,
  onUpdateRejectNotes,
  rejectionNotes,
  isRejecting,
  isSubmitting,
  disabled,
}: {
  onApprove: () => void;
  onReject: () => void;
  onCancelReject: () => void;
  onSubmitReject: () => void;
  onUpdateRejectNotes: (notes: string) => void;
  rejectionNotes: string;
  isRejecting: boolean;
  isSubmitting: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="w-72 space-y-2">
      <div className="flex gap-2">
        <Button className="h-8 px-3" onClick={onApprove} disabled={disabled}>
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          Approve
        </Button>
        <Button
          className="h-8 px-3 border-rose-200 text-rose-700 hover:bg-rose-50"
          variant="outline"
          onClick={onReject}
          disabled={disabled}
        >
          <X className="h-4 w-4" />
          Reject
        </Button>
      </div>
      {isRejecting ? (
        <div className="rounded-md border border-rose-200 bg-rose-50/70 p-2">
          <textarea
            className="min-h-20 w-full resize-y rounded-md border border-rose-200 bg-white px-3 py-2 text-sm text-[#17211d] outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
            value={rejectionNotes}
            onChange={(event) => onUpdateRejectNotes(event.target.value)}
            placeholder="Catatan penolakan"
            disabled={disabled}
          />
          <div className="mt-2 flex justify-end gap-2">
            <Button
              className="h-8 px-3"
              variant="ghost"
              onClick={onCancelReject}
              disabled={disabled}
            >
              Batal
            </Button>
            <Button
              className="h-8 px-3 bg-rose-700 hover:bg-rose-800"
              onClick={onSubmitReject}
              disabled={disabled || !rejectionNotes.trim()}
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Kirim Reject
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function formatDate(value: string) {
  return value.slice(0, 10);
}

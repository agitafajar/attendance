"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { NotebookTabs } from "lucide-react";
import { AdminShell } from "@/components/app/admin-shell";
import { useAuthGuard } from "@/components/app/use-auth-guard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { api } from "@/lib/api";

type LeaveRequest = {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  reason: string;
  attachmentUrl?: string | null;
  status: string;
  approvedAt?: string | null;
  rejectionNote?: string | null;
  employee: {
    employeeNumber: string;
    user: {
      fullName: string;
      email: string;
    };
    supervisor?: {
      user: {
        fullName: string;
      };
    } | null;
  };
  approvedBy?: {
    fullName: string;
  } | null;
};

const leaveTypes = ["", "SICK", "LEAVE", "ANNUAL_LEAVE"];
const statuses = ["", "SUBMITTED", "APPROVED", "REJECTED"];

export default function LeaveRequestsPage() {
  const { user, isReady } = useAuthGuard();
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    type: "",
    status: "",
  });

  const queryString = useMemo(() => {
    const params = new URLSearchParams();

    if (filters.startDate) params.set("startDate", filters.startDate);
    if (filters.endDate) params.set("endDate", filters.endDate);
    if (filters.type) params.set("type", filters.type);
    if (filters.status) params.set("status", filters.status);

    return params.toString();
  }, [filters.endDate, filters.startDate, filters.status, filters.type]);

  const leaveRequestsQuery = useQuery({
    queryKey: ["leave-requests", queryString],
    queryFn: async () => {
      const { data } = await api.get<LeaveRequest[]>(
        `/leave-requests${queryString ? `?${queryString}` : ""}`,
      );
      return data;
    },
    enabled: isReady,
  });

  function updateFilter(field: keyof typeof filters, value: string) {
    setFilters((current) => ({ ...current, [field]: value }));
  }

  return (
    <AdminShell
      title="Leave Requests"
      description="Pantau pengajuan sakit, izin, cuti tahunan, lampiran, dan status approval."
      user={user}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <NotebookTabs className="h-4 w-4" />
            Filter Leave Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Tanggal Mulai</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(event) => updateFilter("startDate", event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Tanggal Akhir</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(event) => updateFilter("endDate", event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Tipe</Label>
              <Select
                id="type"
                value={filters.type}
                onChange={(event) => updateFilter("type", event.target.value)}
              >
                {leaveTypes.map((type) => (
                  <option key={type || "all"} value={type}>
                    {type || "Semua Tipe"}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                id="status"
                value={filters.status}
                onChange={(event) => updateFilter("status", event.target.value)}
              >
                {statuses.map((status) => (
                  <option key={status || "all"} value={status}>
                    {status || "Semua Status"}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Daftar Leave Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-left text-neutral-500">
                  <th className="py-3 pr-4 font-medium">Periode</th>
                  <th className="py-3 pr-4 font-medium">Employee</th>
                  <th className="py-3 pr-4 font-medium">Supervisor</th>
                  <th className="py-3 pr-4 font-medium">Tipe</th>
                  <th className="py-3 pr-4 font-medium">Alasan</th>
                  <th className="py-3 pr-4 font-medium">Lampiran</th>
                  <th className="py-3 pr-4 font-medium">Approved By</th>
                  <th className="py-3 pr-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {leaveRequestsQuery.data?.map((leave) => (
                  <tr key={leave.id} className="border-b border-neutral-100">
                    <td className="py-3 pr-4">
                      {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                    </td>
                    <td className="py-3 pr-4">
                      <p className="font-medium">
                        {leave.employee.employeeNumber} -{" "}
                        {leave.employee.user.fullName}
                      </p>
                      <p className="mt-1 text-xs text-neutral-500">
                        {leave.employee.user.email}
                      </p>
                    </td>
                    <td className="py-3 pr-4">
                      {leave.employee.supervisor?.user.fullName || "-"}
                    </td>
                    <td className="py-3 pr-4">{leave.type}</td>
                    <td className="py-3 pr-4">
                      <p className="line-clamp-2 max-w-sm">{leave.reason}</p>
                      {leave.rejectionNote ? (
                        <p className="mt-1 text-xs text-red-600">
                          {leave.rejectionNote}
                        </p>
                      ) : null}
                    </td>
                    <td className="py-3 pr-4">
                      {leave.attachmentUrl ? (
                        <a
                          href={leave.attachmentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-neutral-950 underline underline-offset-4"
                        >
                          Buka
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="py-3 pr-4">{leave.approvedBy?.fullName || "-"}</td>
                    <td className="py-3 pr-4">
                      <span className="rounded-md bg-neutral-100 px-2 py-1 text-xs font-medium text-neutral-700">
                        {leave.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {!leaveRequestsQuery.isLoading && !leaveRequestsQuery.data?.length ? (
                  <tr>
                    <td className="py-6 text-neutral-500" colSpan={8}>
                      Belum ada pengajuan izin.
                    </td>
                  </tr>
                ) : null}
                {leaveRequestsQuery.isLoading ? (
                  <tr>
                    <td className="py-6 text-neutral-500" colSpan={8}>
                      Memuat data...
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </AdminShell>
  );
}

function formatDate(value: string) {
  return value.slice(0, 10);
}

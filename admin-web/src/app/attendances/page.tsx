"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock, Loader2, RotateCcw } from "lucide-react";
import { AdminShell } from "@/components/app/admin-shell";
import { useAuthGuard } from "@/components/app/use-auth-guard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { SummaryChip } from "@/components/ui/summary-chip";
import { api } from "@/lib/api";

type Attendance = {
  id: string;
  attendanceDate: string;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  lateMinutes?: number | null;
  workMinutes?: number | null;
  status: string;
  employee: {
    employeeNumber: string;
    user: {
      fullName: string;
      email: string;
    };
  };
  assignment: {
    client: {
      name: string;
    };
    workLocation: {
      name: string;
    };
    shift: {
      name: string;
    };
  };
};

const statuses = [
  "",
  "PRESENT",
  "LATE",
  "APPROVED",
  "REJECTED",
  "PENDING_APPROVAL",
  "ABSENT",
  "LEAVE",
];

export default function AttendancesPage() {
  const { user, isReady } = useAuthGuard();
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    status: "",
  });

  const queryString = useMemo(() => {
    const params = new URLSearchParams();

    if (filters.startDate) params.set("startDate", filters.startDate);
    if (filters.endDate) params.set("endDate", filters.endDate);
    if (filters.status) params.set("status", filters.status);

    return params.toString();
  }, [filters.endDate, filters.startDate, filters.status]);

  const attendancesQuery = useQuery({
    queryKey: ["attendances", queryString],
    queryFn: async () => {
      const { data } = await api.get<Attendance[]>(
        `/attendances${queryString ? `?${queryString}` : ""}`,
      );
      return data;
    },
    enabled: isReady,
  });

  const rows = attendancesQuery.data ?? [];
  const activeFilterCount = [
    filters.startDate,
    filters.endDate,
    filters.status,
  ].filter(Boolean).length;

  function updateFilter(field: keyof typeof filters, value: string) {
    setFilters((current) => ({ ...current, [field]: value }));
  }

  function resetFilters() {
    setFilters({
      startDate: "",
      endDate: "",
      status: "",
    });
  }

  return (
    <AdminShell
      title="Attendance"
      description="Pantau absensi check-in, check-out, keterlambatan, dan status approval."
      user={user}
    >
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4" />
              Filter Absensi
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              <SummaryChip label={`${activeFilterCount} active`} value="Filters" tone="teal" />
              <SummaryChip
                label={attendancesQuery.isLoading ? "Loading" : `${rows.length} rows`}
                value="Result"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
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
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="ghost" onClick={resetFilters}>
              <RotateCcw className="h-4 w-4" />
              Reset Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Daftar Absensi</CardTitle>
          <SummaryChip label={`${rows.length} rows`} value="Result" />
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1040px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-left text-neutral-500">
                  <th className="py-3 pr-4 font-medium">Tanggal</th>
                  <th className="py-3 pr-4 font-medium">Employee</th>
                  <th className="py-3 pr-4 font-medium">Client / Lokasi</th>
                  <th className="py-3 pr-4 font-medium">Check In</th>
                  <th className="py-3 pr-4 font-medium">Check Out</th>
                  <th className="py-3 pr-4 font-medium">Late</th>
                  <th className="py-3 pr-4 font-medium">Work</th>
                  <th className="py-3 pr-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((attendance) => (
                  <tr key={attendance.id} className="border-b border-neutral-100">
                    <td className="py-3 pr-4">{formatDate(attendance.attendanceDate)}</td>
                    <td className="py-3 pr-4">
                      <p className="font-medium">
                        {attendance.employee.employeeNumber} -{" "}
                        {attendance.employee.user.fullName}
                      </p>
                      <p className="mt-1 text-xs text-neutral-500">
                        {attendance.employee.user.email}
                      </p>
                    </td>
                    <td className="py-3 pr-4">
                      <p>{attendance.assignment.client.name}</p>
                      <p className="mt-1 text-xs text-neutral-500">
                        {attendance.assignment.workLocation.name} /{" "}
                        {attendance.assignment.shift.name}
                      </p>
                    </td>
                    <td className="py-3 pr-4">{formatDateTime(attendance.checkInTime)}</td>
                    <td className="py-3 pr-4">{formatDateTime(attendance.checkOutTime)}</td>
                    <td className="py-3 pr-4">{attendance.lateMinutes ?? 0} menit</td>
                    <td className="py-3 pr-4">{attendance.workMinutes ?? 0} menit</td>
                    <td className="py-3 pr-4">
                      <StatusBadge status={attendance.status} />
                    </td>
                  </tr>
                ))}
                {!attendancesQuery.isLoading && !attendancesQuery.data?.length ? (
                  <tr>
                    <td className="py-6 text-neutral-500" colSpan={8}>
                      Belum ada data absensi untuk filter ini.
                    </td>
                  </tr>
                ) : null}
                {attendancesQuery.isLoading ? (
                  <tr>
                    <td className="py-8 text-neutral-500" colSpan={8}>
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Memuat data absensi...
                      </span>
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

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("id-ID");
}

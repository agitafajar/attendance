"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, FileSpreadsheet, FileText, Loader2, RotateCcw } from "lucide-react";
import { AdminShell } from "@/components/app/admin-shell";
import { useAuthGuard } from "@/components/app/use-auth-guard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { SummaryChip } from "@/components/ui/summary-chip";
import {
  EmptyTableRow,
  ErrorTableRow,
  QueryErrorState,
  TableSkeletonRows,
} from "@/components/ui/table-state";
import { api } from "@/lib/api";

const REPORT_ROLES = ["ADMIN"] as const;

type ReportType =
  | "daily-attendance"
  | "monthly-attendance"
  | "activity"
  | "client"
  | "location";

type EmployeeOption = {
  id: string;
  employeeNumber: string;
  user: {
    fullName: string;
  };
};

type ClientOption = {
  id: string;
  code: string;
  name: string;
};

type WorkLocationOption = {
  id: string;
  clientId: string;
  name: string;
  client: ClientOption;
};

type ReportResponse = unknown[] | { month: string; rows: unknown[]; details: unknown[] };

const reportTypes: Array<{ value: ReportType; label: string; endpoint: string }> = [
  {
    value: "daily-attendance",
    label: "Daily Attendance",
    endpoint: "/reports/daily-attendance",
  },
  {
    value: "monthly-attendance",
    label: "Monthly Attendance",
    endpoint: "/reports/monthly-attendance",
  },
  {
    value: "activity",
    label: "Activity Report",
    endpoint: "/reports/activities",
  },
  {
    value: "client",
    label: "Client Report",
    endpoint: "/reports/clients",
  },
  {
    value: "location",
    label: "Location Report",
    endpoint: "/reports/locations",
  },
];

const columnsByType: Record<ReportType, Array<{ key: string; label: string }>> = {
  "daily-attendance": [
    { key: "attendanceDate", label: "Tanggal" },
    { key: "employee.employeeNumber", label: "Employee No" },
    { key: "employee.user.fullName", label: "Employee" },
    { key: "assignment.client.name", label: "Client" },
    { key: "assignment.workLocation.name", label: "Lokasi" },
    { key: "status", label: "Status" },
    { key: "lateMinutes", label: "Late" },
    { key: "workMinutes", label: "Work" },
  ],
  "monthly-attendance": [
    { key: "employeeNumber", label: "Employee No" },
    { key: "employeeName", label: "Employee" },
    { key: "present", label: "Present" },
    { key: "late", label: "Late" },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
    { key: "totalWorkMinutes", label: "Work Minutes" },
  ],
  activity: [
    { key: "activityDate", label: "Tanggal" },
    { key: "employee.employeeNumber", label: "Employee No" },
    { key: "employee.user.fullName", label: "Employee" },
    { key: "title", label: "Aktivitas" },
    { key: "status", label: "Status" },
    { key: "photos.length", label: "Foto" },
    { key: "approvedBy.fullName", label: "Approved By" },
  ],
  client: [
    { key: "code", label: "Code" },
    { key: "name", label: "Client" },
    { key: "locations.length", label: "Locations" },
    { key: "assignments.length", label: "Assignments" },
    { key: "isActive", label: "Active" },
  ],
  location: [
    { key: "client.name", label: "Client" },
    { key: "name", label: "Location" },
    { key: "geofenceRadiusMeter", label: "Radius" },
    { key: "assignments.length", label: "Assignments" },
    { key: "isActive", label: "Active" },
  ],
};

export default function ReportsPage() {
  const { user, isReady } = useAuthGuard({ allowedRoles: REPORT_ROLES });
  const defaultMonth = new Date().toISOString().slice(0, 7);
  const [filters, setFilters] = useState({
    reportType: "daily-attendance" as ReportType,
    startDate: "",
    endDate: "",
    month: defaultMonth,
    employeeId: "",
    clientId: "",
    workLocationId: "",
  });
  const [downloadingFormat, setDownloadingFormat] = useState<"excel" | "pdf" | null>(
    null,
  );
  const [downloadError, setDownloadError] = useState("");

  const selectedReport = reportTypes.find((item) => item.value === filters.reportType)!;

  const employeesQuery = useQuery({
    queryKey: ["master-data", "employees"],
    queryFn: async () => {
      const { data } = await api.get<EmployeeOption[]>("/master-data/employees");
      return data;
    },
    enabled: isReady,
  });

  const clientsQuery = useQuery({
    queryKey: ["master-data", "clients"],
    queryFn: async () => {
      const { data } = await api.get<ClientOption[]>("/master-data/clients");
      return data;
    },
    enabled: isReady,
  });

  const locationsQuery = useQuery({
    queryKey: ["master-data", "work-locations"],
    queryFn: async () => {
      const { data } = await api.get<WorkLocationOption[]>("/master-data/work-locations");
      return data;
    },
    enabled: isReady,
  });

  const filteredLocations = useMemo(() => {
    if (!filters.clientId) {
      return locationsQuery.data ?? [];
    }

    return (locationsQuery.data ?? []).filter(
      (location) => location.clientId === filters.clientId,
    );
  }, [filters.clientId, locationsQuery.data]);

  const queryString = useMemo(() => buildQueryString(filters), [filters]);

  const reportQuery = useQuery({
    queryKey: ["reports", filters.reportType, queryString],
    queryFn: async () => {
      const { data } = await api.get<ReportResponse>(
        `${selectedReport.endpoint}${queryString ? `?${queryString}` : ""}`,
      );
      return data;
    },
    enabled: isReady && (filters.reportType !== "monthly-attendance" || Boolean(filters.month)),
  });

  const rows = getRows(reportQuery.data);
  const columns = columnsByType[filters.reportType];
  const previewRows = rows.slice(0, 50);
  const activeFilterCount = [
    filters.startDate,
    filters.endDate,
    filters.employeeId,
    filters.clientId,
    filters.workLocationId,
    filters.reportType === "monthly-attendance" ? filters.month : "",
  ].filter(Boolean).length;

  function updateFilter(field: keyof typeof filters, value: string) {
    setFilters((current) => {
      if (field === "reportType") {
        return { ...current, reportType: value as ReportType };
      }

      if (field === "clientId") {
        return { ...current, clientId: value, workLocationId: "" };
      }

      return { ...current, [field]: value };
    });
  }

  function resetFilters() {
    setFilters((current) => ({
      ...current,
      startDate: "",
      endDate: "",
      month: defaultMonth,
      employeeId: "",
      clientId: "",
      workLocationId: "",
    }));
    setDownloadError("");
  }

  async function download(format: "excel" | "pdf") {
    const params = new URLSearchParams(queryString);
    params.set("type", filters.reportType);

    setDownloadingFormat(format);
    setDownloadError("");

    try {
      const { data } = await api.get<Blob>(
        `/reports/export/${format}?${params.toString()}`,
        {
          responseType: "blob",
        },
      );
      const url = window.URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${filters.reportType}-report.${
        format === "excel" ? "xlsx" : "pdf"
      }`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch {
      setDownloadError("Gagal export report. Cek filter atau coba beberapa saat lagi.");
    } finally {
      setDownloadingFormat(null);
    }
  }

  return (
    <AdminShell
      title="Reports"
      description="Preview laporan operasional dan export ke Excel atau PDF."
      user={user}
    >
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Filter Report
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              <SummaryChip label={selectedReport.label} value="Selected" tone="amber" />
              <SummaryChip label={`${activeFilterCount} active`} value="Filters" tone="teal" />
              <SummaryChip
                label={reportQuery.isLoading ? "Loading" : `${rows.length} rows`}
                value="Preview"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {employeesQuery.isError || clientsQuery.isError || locationsQuery.isError ? (
            <div className="mb-4">
              <QueryErrorState
                title="Opsi filter gagal dimuat"
                description="Sebagian pilihan employee, client, atau lokasi belum tersedia. Coba muat ulang opsi filter."
                onRetry={() => {
                  employeesQuery.refetch();
                  clientsQuery.refetch();
                  locationsQuery.refetch();
                }}
              />
            </div>
          ) : null}

          <div className="grid gap-3 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="reportType">Jenis Report</Label>
              <Select
                id="reportType"
                value={filters.reportType}
                onChange={(event) => updateFilter("reportType", event.target.value)}
              >
                {reportTypes.map((report) => (
                  <option key={report.value} value={report.value}>
                    {report.label}
                  </option>
                ))}
              </Select>
            </div>
            {filters.reportType === "monthly-attendance" ? (
              <div className="space-y-2">
                <Label htmlFor="month">Bulan</Label>
                <Input
                  id="month"
                  type="month"
                  value={filters.month}
                  onChange={(event) => updateFilter("month", event.target.value)}
                />
              </div>
            ) : (
              <>
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
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="employeeId">Employee</Label>
              <Select
                id="employeeId"
                value={filters.employeeId}
                onChange={(event) => updateFilter("employeeId", event.target.value)}
              >
                <option value="">Semua Employee</option>
                {employeesQuery.data?.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.employeeNumber} - {employee.user.fullName}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientId">Client</Label>
              <Select
                id="clientId"
                value={filters.clientId}
                onChange={(event) => updateFilter("clientId", event.target.value)}
              >
                <option value="">Semua Client</option>
                {clientsQuery.data?.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.code} - {client.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="workLocationId">Work Location</Label>
              <Select
                id="workLocationId"
                value={filters.workLocationId}
                onChange={(event) => updateFilter("workLocationId", event.target.value)}
              >
                <option value="">Semua Lokasi</option>
                {filteredLocations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {downloadError ? (
            <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {downloadError}
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button
              onClick={() => download("excel")}
              disabled={reportQuery.isLoading || Boolean(downloadingFormat)}
            >
              {downloadingFormat === "excel" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-4 w-4" />
              )}
              Export Excel
            </Button>
            <Button
              variant="outline"
              onClick={() => download("pdf")}
              disabled={reportQuery.isLoading || Boolean(downloadingFormat)}
            >
              {downloadingFormat === "pdf" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Export PDF
            </Button>
            <Button variant="ghost" onClick={resetFilters} disabled={Boolean(downloadingFormat)}>
              <RotateCcw className="h-4 w-4" />
              Reset Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>{selectedReport.label} Preview</CardTitle>
          <SummaryChip label={`${previewRows.length} / ${rows.length} rows`} value="Preview" />
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1040px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-left text-neutral-500">
                  {columns.map((column) => (
                    <th key={column.key} className="py-3 pr-4 font-medium">
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reportQuery.isLoading ? (
                  <TableSkeletonRows colSpan={columns.length} rows={6} />
                ) : null}
                {reportQuery.isError ? (
                  <ErrorTableRow
                    colSpan={columns.length}
                    title="Report gagal dimuat"
                    description="Preview report belum bisa ditampilkan. Cek filter, lalu coba muat ulang."
                    onRetry={() => reportQuery.refetch()}
                  />
                ) : null}
                {!reportQuery.isLoading && !reportQuery.isError
                  ? previewRows.map((row, index) => (
                      <tr key={index} className="border-b border-neutral-100">
                        {columns.map((column) => (
                          <td key={column.key} className="py-3 pr-4">
                            {formatReportCell(row, column.key)}
                          </td>
                        ))}
                      </tr>
                    ))
                  : null}
                {!reportQuery.isLoading && !reportQuery.isError && !rows.length ? (
                  <EmptyTableRow colSpan={columns.length}>
                    Belum ada data untuk kombinasi filter ini.
                  </EmptyTableRow>
                ) : null}
              </tbody>
            </table>
          </div>
          {rows.length > 50 ? (
            <p className="mt-3 text-sm text-neutral-500">
              Preview menampilkan 50 dari {rows.length} baris. Gunakan export untuk data lengkap.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </AdminShell>
  );
}

function buildQueryString(filters: {
  reportType: ReportType;
  startDate: string;
  endDate: string;
  month: string;
  employeeId: string;
  clientId: string;
  workLocationId: string;
}) {
  const params = new URLSearchParams();

  if (filters.reportType === "monthly-attendance") {
    if (filters.month) params.set("month", filters.month);
  } else {
    if (filters.startDate) params.set("startDate", filters.startDate);
    if (filters.endDate) params.set("endDate", filters.endDate);
  }

  if (filters.employeeId) params.set("employeeId", filters.employeeId);
  if (filters.clientId) params.set("clientId", filters.clientId);
  if (filters.workLocationId) params.set("workLocationId", filters.workLocationId);

  return params.toString();
}

function getRows(data?: ReportResponse) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return data.rows;
}

function getValue(row: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((current, key) => {
    if (current == null) return undefined;

    if (key === "length" && Array.isArray(current)) {
      return current.length;
    }

    if (typeof current === "object" && key in current) {
      return (current as Record<string, unknown>)[key];
    }

    return undefined;
  }, row);
}

function formatValue(value: unknown) {
  if (value == null || value === "") return "-";
  if (typeof value === "boolean") return value ? "Ya" : "Tidak";
  if (typeof value === "number") return String(value);
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    return value.slice(0, 10);
  }
  return String(value);
}

function formatReportCell(row: unknown, key: string) {
  const value = getValue(row, key);

  if (key === "status" && typeof value === "string") {
    return <StatusBadge status={value} />;
  }

  if (key === "isActive" && typeof value === "boolean") {
    return <StatusBadge status={value} />;
  }

  return formatValue(value);
}

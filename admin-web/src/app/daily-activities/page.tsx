"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity } from "lucide-react";
import { AdminShell } from "@/components/app/admin-shell";
import { useAuthGuard } from "@/components/app/use-auth-guard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { api } from "@/lib/api";

type DailyActivity = {
  id: string;
  activityDate: string;
  title: string;
  description: string;
  latitude?: string | null;
  longitude?: string | null;
  status: string;
  rejectionNote?: string | null;
  employee: {
    employeeNumber: string;
    user: {
      fullName: string;
      email: string;
    };
  };
  photos: Array<{
    id: string;
    photoUrl: string;
  }>;
  approvedBy?: {
    fullName: string;
  } | null;
};

const statuses = ["", "DRAFT", "SUBMITTED", "APPROVED", "REJECTED"];

export default function DailyActivitiesPage() {
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

  const activitiesQuery = useQuery({
    queryKey: ["daily-activities", queryString],
    queryFn: async () => {
      const { data } = await api.get<DailyActivity[]>(
        `/daily-activities${queryString ? `?${queryString}` : ""}`,
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
      title="Daily Activities"
      description="Pantau laporan kegiatan harian karyawan."
      user={user}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Filter Aktivitas
          </CardTitle>
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
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Daftar Aktivitas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1040px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-left text-neutral-500">
                  <th className="py-3 pr-4 font-medium">Tanggal</th>
                  <th className="py-3 pr-4 font-medium">Employee</th>
                  <th className="py-3 pr-4 font-medium">Aktivitas</th>
                  <th className="py-3 pr-4 font-medium">GPS</th>
                  <th className="py-3 pr-4 font-medium">Foto</th>
                  <th className="py-3 pr-4 font-medium">Approved By</th>
                  <th className="py-3 pr-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {activitiesQuery.data?.map((activity) => (
                  <tr key={activity.id} className="border-b border-neutral-100">
                    <td className="py-3 pr-4">{formatDate(activity.activityDate)}</td>
                    <td className="py-3 pr-4">
                      <p className="font-medium">
                        {activity.employee.employeeNumber} -{" "}
                        {activity.employee.user.fullName}
                      </p>
                      <p className="mt-1 text-xs text-neutral-500">
                        {activity.employee.user.email}
                      </p>
                    </td>
                    <td className="py-3 pr-4">
                      <p className="font-medium">{activity.title}</p>
                      <p className="mt-1 line-clamp-2 max-w-md text-xs text-neutral-500">
                        {activity.description}
                      </p>
                      {activity.rejectionNote ? (
                        <p className="mt-1 text-xs text-red-600">
                          {activity.rejectionNote}
                        </p>
                      ) : null}
                    </td>
                    <td className="py-3 pr-4">
                      {activity.latitude && activity.longitude
                        ? `${activity.latitude}, ${activity.longitude}`
                        : "-"}
                    </td>
                    <td className="py-3 pr-4">{activity.photos.length}</td>
                    <td className="py-3 pr-4">{activity.approvedBy?.fullName || "-"}</td>
                    <td className="py-3 pr-4">
                      <StatusBadge status={activity.status} />
                    </td>
                  </tr>
                ))}
                {!activitiesQuery.isLoading && !activitiesQuery.data?.length ? (
                  <tr>
                    <td className="py-6 text-neutral-500" colSpan={7}>
                      Belum ada aktivitas.
                    </td>
                  </tr>
                ) : null}
                {activitiesQuery.isLoading ? (
                  <tr>
                    <td className="py-6 text-neutral-500" colSpan={7}>
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

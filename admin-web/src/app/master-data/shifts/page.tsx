"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Clock, Pencil, Plus, Trash2, X } from "lucide-react";
import { AdminShell } from "@/components/app/admin-shell";
import { useAuthGuard } from "@/components/app/use-auth-guard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { api } from "@/lib/api";

const MASTER_DATA_ROLES = ["ADMIN", "SUPERVISOR"] as const;

type Shift = {
  id: string;
  code: string;
  name: string;
  startTime: string;
  endTime: string;
  gracePeriodMinutes: number;
  isActive: boolean;
};

export default function ShiftsPage() {
  const queryClient = useQueryClient();
  const { user, isReady } = useAuthGuard({ allowedRoles: MASTER_DATA_ROLES });
  const canManageMasterData = user?.role?.name === "ADMIN";
  const [editingShiftId, setEditingShiftId] = useState<string | null>(null);
  const [form, setForm] = useState({
    code: "",
    name: "",
    startTime: "08:00",
    endTime: "17:00",
    gracePeriodMinutes: "10",
  });
  const [editForm, setEditForm] = useState({
    code: "",
    name: "",
    startTime: "08:00",
    endTime: "17:00",
    gracePeriodMinutes: "10",
    isActive: "true",
  });

  const shiftsQuery = useQuery({
    queryKey: ["master-data", "shifts"],
    queryFn: async () => {
      const { data } = await api.get<Shift[]>("/master-data/shifts");
      return data;
    },
    enabled: isReady,
  });

  const createShiftMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        code: form.code,
        name: form.name,
        startTime: form.startTime,
        endTime: form.endTime,
        gracePeriodMinutes: Number(form.gracePeriodMinutes),
      };

      const { data } = await api.post<Shift>("/master-data/shifts", payload);
      return data;
    },
    onSuccess: () => {
      setForm({
        code: "",
        name: "",
        startTime: "08:00",
        endTime: "17:00",
        gracePeriodMinutes: "10",
      });
      queryClient.invalidateQueries({ queryKey: ["master-data", "shifts"] });
    },
  });

  const updateShiftMutation = useMutation({
    mutationFn: async () => {
      if (!editingShiftId) {
        throw new Error("No shift selected");
      }

      const payload = {
        code: editForm.code,
        name: editForm.name,
        startTime: editForm.startTime,
        endTime: editForm.endTime,
        gracePeriodMinutes: Number(editForm.gracePeriodMinutes),
        isActive: editForm.isActive === "true",
      };

      const { data } = await api.patch<Shift>(
        `/master-data/shifts/${editingShiftId}`,
        payload,
      );
      return data;
    },
    onSuccess: () => {
      setEditingShiftId(null);
      queryClient.invalidateQueries({ queryKey: ["master-data", "shifts"] });
    },
  });

  const deleteShiftMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete<Shift>(`/master-data/shifts/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["master-data", "shifts"] });
    },
  });

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateEditField(field: keyof typeof editForm, value: string) {
    setEditForm((current) => ({ ...current, [field]: value }));
  }

  function startEdit(shift: Shift) {
    setEditingShiftId(shift.id);
    setEditForm({
      code: shift.code,
      name: shift.name,
      startTime: formatTime(shift.startTime),
      endTime: formatTime(shift.endTime),
      gracePeriodMinutes: String(shift.gracePeriodMinutes),
      isActive: String(shift.isActive),
    });
  }

  function cancelEdit() {
    setEditingShiftId(null);
  }

  function deleteShift(shift: Shift) {
    const confirmed = window.confirm(`Hapus shift ${shift.name}?`);

    if (!confirmed) {
      return;
    }

    deleteShiftMutation.mutate(shift.id);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createShiftMutation.mutate();
  }

  return (
    <AdminShell
      title="Shifts"
      description="Kelola jadwal kerja dan toleransi keterlambatan."
      user={user}
    >
      <div
        className={
          canManageMasterData ? "grid gap-4 xl:grid-cols-[360px_1fr]" : "grid gap-4"
        }
      >
        {canManageMasterData ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Tambah Shift
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="code">Kode</Label>
                <Input
                  id="code"
                  value={form.code}
                  onChange={(event) => updateField("code", event.target.value)}
                  placeholder="SHIFT-PAGI"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nama Shift</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  placeholder="Shift Pagi"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Mulai</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={form.startTime}
                    onChange={(event) => updateField("startTime", event.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">Selesai</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={form.endTime}
                    onChange={(event) => updateField("endTime", event.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="gracePeriodMinutes">Toleransi Terlambat</Label>
                <Input
                  id="gracePeriodMinutes"
                  inputMode="numeric"
                  value={form.gracePeriodMinutes}
                  onChange={(event) =>
                    updateField("gracePeriodMinutes", event.target.value)
                  }
                  required
                />
              </div>
              {createShiftMutation.isError ? (
                <p className="text-sm text-red-600">Gagal menambah shift.</p>
              ) : null}
              <Button
                className="w-full"
                type="submit"
                disabled={createShiftMutation.isPending}
              >
                {createShiftMutation.isPending ? "Menyimpan..." : "Simpan Shift"}
              </Button>
            </form>
          </CardContent>
        </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Daftar Shift
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 text-left text-neutral-500">
                    <th className="py-3 pr-4 font-medium">Kode</th>
                    <th className="py-3 pr-4 font-medium">Nama</th>
                    <th className="py-3 pr-4 font-medium">Jam</th>
                    <th className="py-3 pr-4 font-medium">Toleransi</th>
                    <th className="py-3 pr-4 font-medium">Status</th>
                    {canManageMasterData ? (
                      <th className="py-3 pr-4 font-medium">Aksi</th>
                    ) : null}
                  </tr>
                </thead>
                <tbody>
                  {shiftsQuery.data?.map((shift) => {
                    const isEditing = canManageMasterData && editingShiftId === shift.id;

                    return (
                      <tr key={shift.id} className="border-b border-neutral-100">
                        <td className="py-3 pr-4 font-medium">
                          {isEditing ? (
                            <Input
                              value={editForm.code}
                              onChange={(event) => updateEditField("code", event.target.value)}
                              className="w-36"
                            />
                          ) : (
                            shift.code
                          )}
                        </td>
                        {canManageMasterData ? (
                        <td className="py-3 pr-4">
                          {isEditing ? (
                            <Input
                              value={editForm.name}
                              onChange={(event) => updateEditField("name", event.target.value)}
                              className="min-w-48"
                            />
                          ) : (
                            shift.name
                          )}
                        </td>
                        ) : null}
                        <td className="py-3 pr-4">
                          {isEditing ? (
                            <div className="grid w-56 grid-cols-2 gap-2">
                              <Input
                                type="time"
                                value={editForm.startTime}
                                onChange={(event) =>
                                  updateEditField("startTime", event.target.value)
                                }
                              />
                              <Input
                                type="time"
                                value={editForm.endTime}
                                onChange={(event) =>
                                  updateEditField("endTime", event.target.value)
                                }
                              />
                            </div>
                          ) : (
                            `${formatTime(shift.startTime)} - ${formatTime(shift.endTime)}`
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          {isEditing ? (
                            <Input
                              value={editForm.gracePeriodMinutes}
                              inputMode="numeric"
                              onChange={(event) =>
                                updateEditField("gracePeriodMinutes", event.target.value)
                              }
                              className="w-28"
                            />
                          ) : (
                            `${shift.gracePeriodMinutes} menit`
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          {isEditing ? (
                            <Select
                              value={editForm.isActive}
                              onChange={(event) =>
                                updateEditField("isActive", event.target.value)
                              }
                              className="w-32"
                            >
                              <option value="true">Active</option>
                              <option value="false">Inactive</option>
                            </Select>
                          ) : (
                            <span className="rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
                              {shift.isActive ? "Active" : "Inactive"}
                            </span>
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          {isEditing ? (
                            <div className="flex gap-2">
                              <Button
                                className="h-9 w-9 px-0"
                                onClick={() => updateShiftMutation.mutate()}
                                disabled={updateShiftMutation.isPending}
                                aria-label="Simpan perubahan"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                className="h-9 w-9 px-0"
                                variant="outline"
                                onClick={cancelEdit}
                                disabled={updateShiftMutation.isPending}
                                aria-label="Batal edit"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <Button
                                className="h-9 w-9 px-0"
                                variant="outline"
                                onClick={() => startEdit(shift)}
                                aria-label="Edit shift"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                className="h-9 w-9 px-0 text-red-600 hover:bg-red-50"
                                variant="outline"
                                onClick={() => deleteShift(shift)}
                                disabled={deleteShiftMutation.isPending}
                                aria-label="Hapus shift"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {!shiftsQuery.isLoading && !shiftsQuery.data?.length ? (
                    <tr>
                      <td className="py-6 text-neutral-500" colSpan={canManageMasterData ? 6 : 5}>
                        Belum ada shift.
                      </td>
                    </tr>
                  ) : null}
                  {shiftsQuery.isLoading ? (
                    <tr>
                      <td className="py-6 text-neutral-500" colSpan={canManageMasterData ? 6 : 5}>
                        Memuat data...
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}

function formatTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toISOString().slice(11, 16);
}

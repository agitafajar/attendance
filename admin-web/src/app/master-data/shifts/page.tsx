"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { AdminShell } from "@/components/app/admin-shell";
import { useAuthGuard } from "@/components/app/use-auth-guard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyTableRow, ErrorTableRow, FormError, LoadingTableRow } from "@/components/ui/table-state";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api";

const MASTER_DATA_ROLES = ["ADMIN"] as const;

type Shift = {
  id: string;
  code: string;
  name: string;
  startTime: string;
  endTime: string;
  gracePeriodMinutes: number;
  isActive: boolean;
};

type ShiftForm = {
  code: string;
  name: string;
  startTime: string;
  endTime: string;
  gracePeriodMinutes: string;
  isActive: string;
};

type ConfirmState =
  | { action: "delete"; shift: Shift }
  | null;

const emptyForm: ShiftForm = {
  code: "",
  name: "",
  startTime: "08:00",
  endTime: "17:00",
  gracePeriodMinutes: "10",
  isActive: "true",
};

export default function ShiftsPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { user, isReady } = useAuthGuard({ allowedRoles: MASTER_DATA_ROLES });
  const canManageMasterData = user?.role?.name === "ADMIN";
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);
  const [form, setForm] = useState<ShiftForm>(emptyForm);
  const [confirmState, setConfirmState] = useState<ConfirmState>(null);

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
      const { data } = await api.post<Shift>("/master-data/shifts", buildPayload(form, false));
      return data;
    },
    onSuccess: () => {
      closeModal();
      setConfirmState(null);
      queryClient.invalidateQueries({ queryKey: ["master-data", "shifts"] });
      showToast({ title: "Shift berhasil ditambahkan", tone: "success" });
    },
    onError: () => {
      setConfirmState(null);
      showToast({ title: "Gagal menambah shift", tone: "error" });
    },
  });

  const updateShiftMutation = useMutation({
    mutationFn: async () => {
      if (!selectedShiftId) {
        throw new Error("No shift selected");
      }

      const { data } = await api.patch<Shift>(
        `/master-data/shifts/${selectedShiftId}`,
        buildPayload(form, true),
      );
      return data;
    },
    onSuccess: () => {
      closeModal();
      setConfirmState(null);
      queryClient.invalidateQueries({ queryKey: ["master-data", "shifts"] });
      showToast({ title: "Shift berhasil diperbarui", tone: "success" });
    },
    onError: () => {
      setConfirmState(null);
      showToast({ title: "Gagal memperbarui shift", tone: "error" });
    },
  });

  const deleteShiftMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete<Shift>(`/master-data/shifts/${id}`);
      return data;
    },
    onSuccess: () => {
      setConfirmState(null);
      queryClient.invalidateQueries({ queryKey: ["master-data", "shifts"] });
      showToast({ title: "Shift berhasil dihapus", tone: "success" });
    },
    onError: () => {
      setConfirmState(null);
      showToast({ title: "Gagal menghapus shift", tone: "error" });
    },
  });

  const isMutating =
    createShiftMutation.isPending ||
    updateShiftMutation.isPending ||
    deleteShiftMutation.isPending;

  function updateField(field: keyof ShiftForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function openCreateModal() {
    setSelectedShiftId(null);
    setForm(emptyForm);
    setModalMode("create");
  }

  function openEditModal(shift: Shift) {
    setSelectedShiftId(shift.id);
    setForm({
      code: shift.code,
      name: shift.name,
      startTime: formatTime(shift.startTime),
      endTime: formatTime(shift.endTime),
      gracePeriodMinutes: String(shift.gracePeriodMinutes),
      isActive: String(shift.isActive),
    });
    setModalMode("edit");
  }

  function closeModal() {
    if (isMutating) return;
    setModalMode(null);
    setSelectedShiftId(null);
    setForm(emptyForm);
  }

  function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (modalMode === "edit") {
      updateShiftMutation.mutate();
      return;
    }

    createShiftMutation.mutate();
  }

  function confirmAction() {
    if (confirmState?.action === "delete") {
      deleteShiftMutation.mutate(confirmState.shift.id);
    }
  }

  return (
    <AdminShell
      title="Shifts"
      description="Kelola jadwal kerja dan toleransi keterlambatan."
      user={user}
    >
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Daftar Shift
              </CardTitle>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                Jadwal kerja aktif dan toleransi keterlambatan karyawan.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-[var(--muted)]">
                {shiftsQuery.data?.length ?? 0} shift
              </span>
              {canManageMasterData ? (
                <Button onClick={openCreateModal}>
                  <Plus className="h-4 w-4" />
                  Shift
                </Button>
              ) : null}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse text-sm">
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
                {shiftsQuery.data?.map((shift) => (
                  <tr key={shift.id} className="border-b border-neutral-100">
                    <td className="py-3 pr-4 font-medium">{shift.code}</td>
                    <td className="py-3 pr-4">{shift.name}</td>
                    <td className="py-3 pr-4">
                      {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                    </td>
                    <td className="py-3 pr-4">{shift.gracePeriodMinutes} menit</td>
                    <td className="py-3 pr-4">
                      <StatusBadge status={shift.isActive} />
                    </td>
                    {canManageMasterData ? (
                      <td className="py-3 pr-4">
                        <div className="flex gap-2">
                          <Button
                            className="h-9 w-9 px-0"
                            variant="outline"
                            onClick={() => openEditModal(shift)}
                            aria-label="Edit shift"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            className="h-9 w-9 border-red-200 px-0 text-red-700 hover:border-red-300 hover:bg-red-50"
                            variant="outline"
                            onClick={() => setConfirmState({ action: "delete", shift })}
                            disabled={deleteShiftMutation.isPending}
                            aria-label="Hapus shift"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))}
                {!shiftsQuery.isLoading && !shiftsQuery.isError && !shiftsQuery.data?.length ? (
                  <EmptyTableRow colSpan={canManageMasterData ? 6 : 5}>
                    Belum ada shift.
                  </EmptyTableRow>
                ) : null}
                {shiftsQuery.isLoading ? (
                  <LoadingTableRow colSpan={canManageMasterData ? 6 : 5} />
                ) : null}
                {shiftsQuery.isError ? (
                  <ErrorTableRow
                    colSpan={canManageMasterData ? 6 : 5}
                    title="Shift gagal dimuat"
                    description="Data shift belum bisa ditampilkan. Coba muat ulang beberapa saat lagi."
                    onRetry={() => shiftsQuery.refetch()}
                  />
                ) : null}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Modal
        open={Boolean(modalMode)}
        title={modalMode === "edit" ? "Edit Shift" : "Tambah Shift"}
        description="Atur nama shift, rentang jam kerja, dan toleransi keterlambatan."
        size="lg"
        onClose={closeModal}
        footer={
          <>
            <Button variant="outline" onClick={closeModal} disabled={isMutating}>
              Batal
            </Button>
            <Button type="submit" form="shift-form" disabled={isMutating}>
              {isMutating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {modalMode === "edit" ? "Simpan Perubahan" : "Simpan Shift"}
            </Button>
          </>
        }
      >
        <form id="shift-form" className="space-y-4" onSubmit={submitForm}>
          <div className="grid gap-4 sm:grid-cols-2">
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
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
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
            <div className="space-y-2">
              <Label htmlFor="gracePeriodMinutes">Toleransi</Label>
              <Input
                id="gracePeriodMinutes"
                inputMode="numeric"
                value={form.gracePeriodMinutes}
                onChange={(event) => updateField("gracePeriodMinutes", event.target.value)}
                required
              />
            </div>
          </div>
          {modalMode === "edit" ? (
            <div className="space-y-2">
              <Label htmlFor="isActive">Status</Label>
              <Select
                id="isActive"
                value={form.isActive}
                onChange={(event) => updateField("isActive", event.target.value)}
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </Select>
            </div>
          ) : null}
          {createShiftMutation.isError && modalMode === "create" ? (
            <FormError>Gagal menambah shift.</FormError>
          ) : null}
          {updateShiftMutation.isError && modalMode === "edit" ? (
            <FormError>Gagal memperbarui shift.</FormError>
          ) : null}
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmState)}
        title={getConfirmTitle(confirmState)}
        description={getConfirmDescription(confirmState)}
        confirmText={getConfirmText(confirmState)}
        tone={confirmState?.action === "delete" ? "danger" : "default"}
        isLoading={isMutating}
        onCancel={() => setConfirmState(null)}
        onConfirm={confirmAction}
      />
    </AdminShell>
  );
}

function buildPayload(form: ShiftForm, includeActive: boolean) {
  const payload: {
    code: string;
    name: string;
    startTime: string;
    endTime: string;
    gracePeriodMinutes: number;
    isActive?: boolean;
  } = {
    code: form.code,
    name: form.name,
    startTime: form.startTime,
    endTime: form.endTime,
    gracePeriodMinutes: Number(form.gracePeriodMinutes),
  };

  if (includeActive) {
    payload.isActive = form.isActive === "true";
  }

  return payload;
}

function getConfirmTitle(confirmState: ConfirmState) {
  return confirmState?.action === "delete" ? "Hapus shift?" : "";
}

function getConfirmDescription(confirmState: ConfirmState) {
  if (confirmState?.action === "delete") {
    return `Shift ${confirmState.shift.name} akan dihapus dari master data.`;
  }

  return "";
}

function getConfirmText(confirmState: ConfirmState) {
  return confirmState?.action === "delete" ? "Hapus Shift" : "Konfirmasi";
}

function formatTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toISOString().slice(11, 16);
}

"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, Plus, Trash2, Users } from "lucide-react";
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

type Supervisor = {
  id: string;
  supervisorNumber: string;
  user: {
    email: string;
    fullName: string;
    phone?: string | null;
    isActive: boolean;
  };
};

type SupervisorForm = {
  supervisorNumber: string;
  fullName: string;
  email: string;
  phone: string;
  password: string;
  isActive: string;
};

type ConfirmState =
  | { action: "delete"; supervisor: Supervisor }
  | null;

const emptyForm: SupervisorForm = {
  supervisorNumber: "",
  fullName: "",
  email: "",
  phone: "",
  password: "",
  isActive: "true",
};

export default function SupervisorsPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { user, isReady } = useAuthGuard({ allowedRoles: MASTER_DATA_ROLES });
  const canManageMasterData = user?.role?.name === "ADMIN";
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [selectedSupervisorId, setSelectedSupervisorId] = useState<string | null>(null);
  const [form, setForm] = useState<SupervisorForm>(emptyForm);
  const [confirmState, setConfirmState] = useState<ConfirmState>(null);

  const supervisorsQuery = useQuery({
    queryKey: ["master-data", "supervisors"],
    queryFn: async () => {
      const { data } = await api.get<Supervisor[]>("/master-data/supervisors");
      return data;
    },
    enabled: isReady,
  });

  const createSupervisorMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<Supervisor>(
        "/master-data/supervisors",
        buildPayload(form, "create"),
      );
      return data;
    },
    onSuccess: () => {
      closeModal();
      setConfirmState(null);
      queryClient.invalidateQueries({ queryKey: ["master-data", "supervisors"] });
      showToast({ title: "Supervisor berhasil ditambahkan", tone: "success" });
    },
    onError: () => {
      setConfirmState(null);
      showToast({ title: "Gagal menambah supervisor", tone: "error" });
    },
  });

  const updateSupervisorMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSupervisorId) {
        throw new Error("No supervisor selected");
      }

      const { data } = await api.patch<Supervisor>(
        `/master-data/supervisors/${selectedSupervisorId}`,
        buildPayload(form, "edit"),
      );
      return data;
    },
    onSuccess: () => {
      closeModal();
      setConfirmState(null);
      queryClient.invalidateQueries({ queryKey: ["master-data", "supervisors"] });
      showToast({ title: "Supervisor berhasil diperbarui", tone: "success" });
    },
    onError: () => {
      setConfirmState(null);
      showToast({ title: "Gagal memperbarui supervisor", tone: "error" });
    },
  });

  const deleteSupervisorMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete<Supervisor>(`/master-data/supervisors/${id}`);
      return data;
    },
    onSuccess: () => {
      setConfirmState(null);
      queryClient.invalidateQueries({ queryKey: ["master-data", "supervisors"] });
      showToast({ title: "Supervisor berhasil dihapus", tone: "success" });
    },
    onError: () => {
      setConfirmState(null);
      showToast({ title: "Gagal menghapus supervisor", tone: "error" });
    },
  });

  const isMutating =
    createSupervisorMutation.isPending ||
    updateSupervisorMutation.isPending ||
    deleteSupervisorMutation.isPending;

  function updateField(field: keyof SupervisorForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function openCreateModal() {
    setSelectedSupervisorId(null);
    setForm(emptyForm);
    setModalMode("create");
  }

  function openEditModal(supervisor: Supervisor) {
    setSelectedSupervisorId(supervisor.id);
    setForm({
      supervisorNumber: supervisor.supervisorNumber,
      fullName: supervisor.user.fullName,
      email: supervisor.user.email,
      phone: supervisor.user.phone || "",
      password: "",
      isActive: String(supervisor.user.isActive),
    });
    setModalMode("edit");
  }

  function closeModal() {
    if (isMutating) return;
    setModalMode(null);
    setSelectedSupervisorId(null);
    setForm(emptyForm);
  }

  function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (modalMode === "edit") {
      updateSupervisorMutation.mutate();
      return;
    }

    createSupervisorMutation.mutate();
  }

  function confirmAction() {
    if (confirmState?.action === "delete") {
      deleteSupervisorMutation.mutate(confirmState.supervisor.id);
    }
  }

  return (
    <AdminShell
      title="Supervisors"
      description="Kelola akun supervisor lapangan."
      user={user}
    >
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Daftar Supervisor
              </CardTitle>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                Akun supervisor yang dapat memantau tim lapangan.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-[var(--muted)]">
                {supervisorsQuery.data?.length ?? 0} supervisor
              </span>
              {canManageMasterData ? (
                <Button onClick={openCreateModal}>
                  <Plus className="h-4 w-4" />
                  Supervisor
                </Button>
              ) : null}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-left text-neutral-500">
                  <th className="py-3 pr-4 font-medium">Nomor</th>
                  <th className="py-3 pr-4 font-medium">Nama</th>
                  <th className="py-3 pr-4 font-medium">Email</th>
                  <th className="py-3 pr-4 font-medium">Telepon</th>
                  <th className="py-3 pr-4 font-medium">Status</th>
                  {canManageMasterData ? (
                    <th className="py-3 pr-4 font-medium">Aksi</th>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {supervisorsQuery.data?.map((supervisor) => (
                  <tr key={supervisor.id} className="border-b border-neutral-100">
                    <td className="py-3 pr-4 font-medium">
                      {supervisor.supervisorNumber}
                    </td>
                    <td className="py-3 pr-4">{supervisor.user.fullName}</td>
                    <td className="py-3 pr-4">{supervisor.user.email}</td>
                    <td className="py-3 pr-4">{supervisor.user.phone || "-"}</td>
                    <td className="py-3 pr-4">
                      <StatusBadge status={supervisor.user.isActive} />
                    </td>
                    {canManageMasterData ? (
                      <td className="py-3 pr-4">
                        <div className="flex gap-2">
                          <Button
                            className="h-9 w-9 px-0"
                            variant="outline"
                            onClick={() => openEditModal(supervisor)}
                            aria-label="Edit supervisor"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            className="h-9 w-9 border-red-200 px-0 text-red-700 hover:border-red-300 hover:bg-red-50"
                            variant="outline"
                            onClick={() => setConfirmState({ action: "delete", supervisor })}
                            disabled={deleteSupervisorMutation.isPending}
                            aria-label="Hapus supervisor"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))}
                {!supervisorsQuery.isLoading && !supervisorsQuery.isError && !supervisorsQuery.data?.length ? (
                  <EmptyTableRow colSpan={canManageMasterData ? 6 : 5}>
                    Belum ada supervisor.
                  </EmptyTableRow>
                ) : null}
                {supervisorsQuery.isLoading ? (
                  <LoadingTableRow colSpan={canManageMasterData ? 6 : 5} />
                ) : null}
                {supervisorsQuery.isError ? (
                  <ErrorTableRow
                    colSpan={canManageMasterData ? 6 : 5}
                    title="Supervisor gagal dimuat"
                    description="Data supervisor belum bisa ditampilkan. Coba muat ulang beberapa saat lagi."
                    onRetry={() => supervisorsQuery.refetch()}
                  />
                ) : null}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Modal
        open={Boolean(modalMode)}
        title={modalMode === "edit" ? "Edit Supervisor" : "Tambah Supervisor"}
        description="Kelola identitas supervisor dan akses akun. Modal dapat discroll jika konten panjang."
        size="lg"
        onClose={closeModal}
        footer={
          <>
            <Button variant="outline" onClick={closeModal} disabled={isMutating}>
              Batal
            </Button>
            <Button type="submit" form="supervisor-form" disabled={isMutating}>
              {isMutating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {modalMode === "edit" ? "Simpan Perubahan" : "Simpan Supervisor"}
            </Button>
          </>
        }
      >
        <form id="supervisor-form" className="space-y-4" onSubmit={submitForm}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="supervisorNumber">Nomor Supervisor</Label>
              <Input
                id="supervisorNumber"
                value={form.supervisorNumber}
                onChange={(event) => updateField("supervisorNumber", event.target.value)}
                placeholder="SPV-002"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullName">Nama Lengkap</Label>
              <Input
                id="fullName"
                value={form.fullName}
                onChange={(event) => updateField("fullName", event.target.value)}
                placeholder="Nama Supervisor"
                required
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                placeholder="supervisor@company.test"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telepon</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                placeholder="081..."
              />
            </div>
          </div>
          {modalMode === "create" ? (
            <div className="space-y-2">
              <Label htmlFor="password">Password Awal</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(event) => updateField("password", event.target.value)}
                required
              />
            </div>
          ) : (
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
          )}
          {createSupervisorMutation.isError && modalMode === "create" ? (
            <FormError>Gagal menambah supervisor.</FormError>
          ) : null}
          {updateSupervisorMutation.isError && modalMode === "edit" ? (
            <FormError>Gagal memperbarui supervisor.</FormError>
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

function buildPayload(form: SupervisorForm, mode: "create" | "edit") {
  const payload: {
    supervisorNumber: string;
    fullName: string;
    email: string;
    phone?: string;
    password?: string;
    isActive?: boolean;
  } = {
    supervisorNumber: form.supervisorNumber,
    fullName: form.fullName,
    email: form.email,
    phone: form.phone || undefined,
  };

  if (mode === "create") {
    payload.password = form.password;
  } else {
    payload.isActive = form.isActive === "true";
  }

  return payload;
}

function getConfirmTitle(confirmState: ConfirmState) {
  return confirmState?.action === "delete" ? "Hapus supervisor?" : "";
}

function getConfirmDescription(confirmState: ConfirmState) {
  if (confirmState?.action === "delete") {
    return `Supervisor ${confirmState.supervisor.user.fullName} akan dihapus dari master data.`;
  }

  return "";
}

function getConfirmText(confirmState: ConfirmState) {
  return confirmState?.action === "delete" ? "Hapus Supervisor" : "Konfirmasi";
}

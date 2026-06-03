"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
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

type Client = {
  id: string;
  code: string;
  name: string;
  address?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
  isActive: boolean;
};

type ClientForm = {
  code: string;
  name: string;
  address: string;
  contactName: string;
  contactPhone: string;
  isActive: string;
};

type ConfirmState =
  | { action: "delete"; client: Client }
  | null;

const emptyForm: ClientForm = {
  code: "",
  name: "",
  address: "",
  contactName: "",
  contactPhone: "",
  isActive: "true",
};

export default function ClientsPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { user, isReady } = useAuthGuard({ allowedRoles: MASTER_DATA_ROLES });
  const canManageMasterData = user?.role?.name === "ADMIN";
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [form, setForm] = useState<ClientForm>(emptyForm);
  const [confirmState, setConfirmState] = useState<ConfirmState>(null);

  const clientsQuery = useQuery({
    queryKey: ["master-data", "clients"],
    queryFn: async () => {
      const { data } = await api.get<Client[]>("/master-data/clients");
      return data;
    },
    enabled: isReady,
  });

  const createClientMutation = useMutation({
    mutationFn: async () => {
      const payload = buildPayload(form, false);
      const { data } = await api.post<Client>("/master-data/clients", payload);
      return data;
    },
    onSuccess: () => {
      closeModal();
      setConfirmState(null);
      queryClient.invalidateQueries({ queryKey: ["master-data", "clients"] });
      showToast({ title: "Client berhasil ditambahkan", tone: "success" });
    },
    onError: () => {
      setConfirmState(null);
      showToast({ title: "Gagal menambah client", tone: "error" });
    },
  });

  const updateClientMutation = useMutation({
    mutationFn: async () => {
      if (!selectedClientId) {
        throw new Error("No client selected");
      }

      const payload = buildPayload(form, true);
      const { data } = await api.patch<Client>(
        `/master-data/clients/${selectedClientId}`,
        payload,
      );
      return data;
    },
    onSuccess: () => {
      closeModal();
      setConfirmState(null);
      queryClient.invalidateQueries({ queryKey: ["master-data", "clients"] });
      showToast({ title: "Client berhasil diperbarui", tone: "success" });
    },
    onError: () => {
      setConfirmState(null);
      showToast({ title: "Gagal memperbarui client", tone: "error" });
    },
  });

  const deleteClientMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete<Client>(`/master-data/clients/${id}`);
      return data;
    },
    onSuccess: () => {
      setConfirmState(null);
      queryClient.invalidateQueries({ queryKey: ["master-data", "clients"] });
      showToast({ title: "Client berhasil dihapus", tone: "success" });
    },
    onError: () => {
      setConfirmState(null);
      showToast({ title: "Gagal menghapus client", tone: "error" });
    },
  });

  const isMutating =
    createClientMutation.isPending ||
    updateClientMutation.isPending ||
    deleteClientMutation.isPending;

  function updateField(field: keyof ClientForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function openCreateModal() {
    setSelectedClientId(null);
    setForm(emptyForm);
    setModalMode("create");
  }

  function openEditModal(client: Client) {
    setSelectedClientId(client.id);
    setForm({
      code: client.code,
      name: client.name,
      address: client.address || "",
      contactName: client.contactName || "",
      contactPhone: client.contactPhone || "",
      isActive: String(client.isActive),
    });
    setModalMode("edit");
  }

  function closeModal() {
    if (isMutating) return;
    setModalMode(null);
    setSelectedClientId(null);
    setForm(emptyForm);
  }

  function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (modalMode === "edit") {
      updateClientMutation.mutate();
      return;
    }

    createClientMutation.mutate();
  }

  function confirmAction() {
    if (confirmState?.action === "delete") {
      deleteClientMutation.mutate(confirmState.client.id);
    }
  }

  return (
    <AdminShell
      title="Clients"
      description="Kelola daftar perusahaan klien untuk assignment karyawan."
      user={user}
    >
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Daftar Client
              </CardTitle>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                Semua client yang dapat dipakai untuk lokasi kerja dan assignment.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-[var(--muted)]">
                {clientsQuery.data?.length ?? 0} client
              </span>
              {canManageMasterData ? (
                <Button onClick={openCreateModal}>
                  <Plus className="h-4 w-4" />
                  Client
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
                  <th className="py-3 pr-4 font-medium">Kontak</th>
                  <th className="py-3 pr-4 font-medium">Telepon</th>
                  <th className="py-3 pr-4 font-medium">Status</th>
                  {canManageMasterData ? (
                    <th className="py-3 pr-4 font-medium">Aksi</th>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {clientsQuery.data?.map((client) => (
                  <tr key={client.id} className="border-b border-neutral-100">
                    <td className="py-3 pr-4 font-medium">{client.code}</td>
                    <td className="py-3 pr-4">
                      <p className="font-medium">{client.name}</p>
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        {client.address || "-"}
                      </p>
                    </td>
                    <td className="py-3 pr-4">{client.contactName || "-"}</td>
                    <td className="py-3 pr-4">{client.contactPhone || "-"}</td>
                    <td className="py-3 pr-4">
                      <StatusBadge status={client.isActive} />
                    </td>
                    {canManageMasterData ? (
                      <td className="py-3 pr-4">
                        <div className="flex gap-2">
                          <Button
                            className="h-9 w-9 px-0"
                            variant="outline"
                            onClick={() => openEditModal(client)}
                            aria-label="Edit client"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            className="h-9 w-9 border-red-200 px-0 text-red-700 hover:border-red-300 hover:bg-red-50"
                            variant="outline"
                            onClick={() => setConfirmState({ action: "delete", client })}
                            disabled={deleteClientMutation.isPending}
                            aria-label="Hapus client"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))}
                {!clientsQuery.isLoading && !clientsQuery.isError && !clientsQuery.data?.length ? (
                  <EmptyTableRow colSpan={canManageMasterData ? 6 : 5}>
                    Belum ada client.
                  </EmptyTableRow>
                ) : null}
                {clientsQuery.isLoading ? (
                  <LoadingTableRow colSpan={canManageMasterData ? 6 : 5} />
                ) : null}
                {clientsQuery.isError ? (
                  <ErrorTableRow
                    colSpan={canManageMasterData ? 6 : 5}
                    title="Client gagal dimuat"
                    description="Data client belum bisa ditampilkan. Coba muat ulang beberapa saat lagi."
                    onRetry={() => clientsQuery.refetch()}
                  />
                ) : null}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Modal
        open={Boolean(modalMode)}
        title={modalMode === "edit" ? "Edit Client" : "Tambah Client"}
        description="Lengkapi data client. Jika form panjang, area modal ini bisa discroll."
        size="lg"
        onClose={closeModal}
        footer={
          <>
            <Button variant="outline" onClick={closeModal} disabled={isMutating}>
              Batal
            </Button>
            <Button type="submit" form="client-form" disabled={isMutating}>
              {isMutating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {modalMode === "edit" ? "Simpan Perubahan" : "Simpan Client"}
            </Button>
          </>
        }
      >
        <form id="client-form" className="space-y-4" onSubmit={submitForm}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="code">Kode</Label>
              <Input
                id="code"
                value={form.code}
                onChange={(event) => updateField("code", event.target.value)}
                placeholder="CL-002"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nama Client</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                placeholder="PT Nama Klien"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Alamat</Label>
            <Input
              id="address"
              value={form.address}
              onChange={(event) => updateField("address", event.target.value)}
              placeholder="Jl. Contoh No. 1"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contactName">Kontak</Label>
              <Input
                id="contactName"
                value={form.contactName}
                onChange={(event) => updateField("contactName", event.target.value)}
                placeholder="Nama PIC"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactPhone">Telepon</Label>
              <Input
                id="contactPhone"
                value={form.contactPhone}
                onChange={(event) => updateField("contactPhone", event.target.value)}
                placeholder="081..."
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
          {createClientMutation.isError && modalMode === "create" ? (
            <FormError>Gagal menambah client.</FormError>
          ) : null}
          {updateClientMutation.isError && modalMode === "edit" ? (
            <FormError>Gagal memperbarui client.</FormError>
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

function buildPayload(form: ClientForm, includeActive: boolean) {
  const payload: {
    code: string;
    name: string;
    address?: string;
    contactName?: string;
    contactPhone?: string;
    isActive?: boolean;
  } = {
    code: form.code,
    name: form.name,
    address: form.address || undefined,
    contactName: form.contactName || undefined,
    contactPhone: form.contactPhone || undefined,
  };

  if (includeActive) {
    payload.isActive = form.isActive === "true";
  }

  return payload;
}

function getConfirmTitle(confirmState: ConfirmState) {
  return confirmState?.action === "delete" ? "Hapus client?" : "";
}

function getConfirmDescription(confirmState: ConfirmState) {
  if (confirmState?.action === "delete") {
    return `Client ${confirmState.client.name} akan dihapus dari master data. Aksi ini tidak bisa dibatalkan dari halaman ini.`;
  }

  return "";
}

function getConfirmText(confirmState: ConfirmState) {
  return confirmState?.action === "delete" ? "Hapus Client" : "Konfirmasi";
}

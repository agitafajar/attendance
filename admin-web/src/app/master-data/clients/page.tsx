"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { AdminShell } from "@/components/app/admin-shell";
import { useAuthGuard } from "@/components/app/use-auth-guard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { api } from "@/lib/api";

const MASTER_DATA_ROLES = ["ADMIN", "SUPERVISOR"] as const;

type Client = {
  id: string;
  code: string;
  name: string;
  address?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
  isActive: boolean;
};

export default function ClientsPage() {
  const queryClient = useQueryClient();
  const { user, isReady } = useAuthGuard({ allowedRoles: MASTER_DATA_ROLES });
  const canManageMasterData = user?.role?.name === "ADMIN";
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [form, setForm] = useState({
    code: "",
    name: "",
    address: "",
    contactName: "",
    contactPhone: "",
  });
  const [editForm, setEditForm] = useState({
    code: "",
    name: "",
    address: "",
    contactName: "",
    contactPhone: "",
    isActive: "true",
  });

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
      const payload = {
        code: form.code,
        name: form.name,
        address: form.address || undefined,
        contactName: form.contactName || undefined,
        contactPhone: form.contactPhone || undefined,
      };

      const { data } = await api.post<Client>("/master-data/clients", payload);
      return data;
    },
    onSuccess: () => {
      setForm({
        code: "",
        name: "",
        address: "",
        contactName: "",
        contactPhone: "",
      });
      queryClient.invalidateQueries({ queryKey: ["master-data", "clients"] });
    },
  });

  const updateClientMutation = useMutation({
    mutationFn: async () => {
      if (!editingClientId) {
        throw new Error("No client selected");
      }

      const payload = {
        code: editForm.code,
        name: editForm.name,
        address: editForm.address || undefined,
        contactName: editForm.contactName || undefined,
        contactPhone: editForm.contactPhone || undefined,
        isActive: editForm.isActive === "true",
      };

      const { data } = await api.patch<Client>(
        `/master-data/clients/${editingClientId}`,
        payload,
      );
      return data;
    },
    onSuccess: () => {
      setEditingClientId(null);
      queryClient.invalidateQueries({ queryKey: ["master-data", "clients"] });
    },
  });

  const deleteClientMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete<Client>(`/master-data/clients/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["master-data", "clients"] });
    },
  });

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateEditField(field: keyof typeof editForm, value: string) {
    setEditForm((current) => ({ ...current, [field]: value }));
  }

  function startEdit(client: Client) {
    setEditingClientId(client.id);
    setEditForm({
      code: client.code,
      name: client.name,
      address: client.address || "",
      contactName: client.contactName || "",
      contactPhone: client.contactPhone || "",
      isActive: String(client.isActive),
    });
  }

  function cancelEdit() {
    setEditingClientId(null);
  }

  function deleteClient(client: Client) {
    const confirmed = window.confirm(`Hapus client ${client.name}?`);

    if (!confirmed) {
      return;
    }

    deleteClientMutation.mutate(client.id);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createClientMutation.mutate();
  }

  return (
    <AdminShell
      title="Clients"
      description="Kelola daftar perusahaan klien untuk assignment karyawan."
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
              Tambah Client
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
              <div className="space-y-2">
                <Label htmlFor="address">Alamat</Label>
                <Input
                  id="address"
                  value={form.address}
                  onChange={(event) => updateField("address", event.target.value)}
                  placeholder="Jl. Contoh No. 1"
                />
              </div>
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
              {createClientMutation.isError ? (
                <p className="text-sm text-red-600">Gagal menambah client.</p>
              ) : null}
              <Button
                className="w-full"
                type="submit"
                disabled={createClientMutation.isPending}
              >
                {createClientMutation.isPending ? "Menyimpan..." : "Simpan Client"}
              </Button>
            </form>
          </CardContent>
        </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Daftar Client
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] border-collapse text-sm">
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
                  {clientsQuery.data?.map((client) => {
                    const isEditing = canManageMasterData && editingClientId === client.id;

                    return (
                      <tr key={client.id} className="border-b border-neutral-100">
                        <td className="py-3 pr-4 font-medium">
                          {isEditing ? (
                            <Input
                              value={editForm.code}
                              onChange={(event) => updateEditField("code", event.target.value)}
                              className="w-32"
                            />
                          ) : (
                            client.code
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          {isEditing ? (
                            <div className="space-y-2">
                              <Input
                                value={editForm.name}
                                onChange={(event) => updateEditField("name", event.target.value)}
                                className="min-w-56"
                              />
                              <Input
                                value={editForm.address}
                                onChange={(event) =>
                                  updateEditField("address", event.target.value)
                                }
                                placeholder="Alamat"
                                className="min-w-56"
                              />
                            </div>
                          ) : (
                            <div>
                              <p>{client.name}</p>
                              <p className="mt-1 text-xs text-neutral-500">
                                {client.address || "-"}
                              </p>
                            </div>
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          {isEditing ? (
                            <Input
                              value={editForm.contactName}
                              onChange={(event) =>
                                updateEditField("contactName", event.target.value)
                              }
                              className="w-40"
                            />
                          ) : (
                            client.contactName || "-"
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          {isEditing ? (
                            <Input
                              value={editForm.contactPhone}
                              onChange={(event) =>
                                updateEditField("contactPhone", event.target.value)
                              }
                              className="w-40"
                            />
                          ) : (
                            client.contactPhone || "-"
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
                            <StatusBadge status={client.isActive} />
                          )}
                        </td>
                        {canManageMasterData ? (
                          <td className="py-3 pr-4">
                            {isEditing ? (
                              <div className="flex gap-2">
                                <Button
                                  className="h-9 w-9 px-0"
                                  onClick={() => updateClientMutation.mutate()}
                                  disabled={updateClientMutation.isPending}
                                  aria-label="Simpan perubahan"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  className="h-9 w-9 px-0"
                                  variant="outline"
                                  onClick={cancelEdit}
                                  disabled={updateClientMutation.isPending}
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
                                  onClick={() => startEdit(client)}
                                  aria-label="Edit client"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  className="h-9 w-9 px-0 text-red-600 hover:bg-red-50"
                                  variant="outline"
                                  onClick={() => deleteClient(client)}
                                  disabled={deleteClientMutation.isPending}
                                  aria-label="Hapus client"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </td>
                        ) : null}
                      </tr>
                    );
                  })}
                  {!clientsQuery.isLoading && !clientsQuery.data?.length ? (
                    <tr>
                      <td className="py-6 text-neutral-500" colSpan={canManageMasterData ? 6 : 5}>
                        Belum ada client.
                      </td>
                    </tr>
                  ) : null}
                  {clientsQuery.isLoading ? (
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

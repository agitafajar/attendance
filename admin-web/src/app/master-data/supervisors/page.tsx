"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Pencil, Plus, Trash2, Users, X } from "lucide-react";
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

export default function SupervisorsPage() {
  const queryClient = useQueryClient();
  const { user, isReady } = useAuthGuard({ allowedRoles: MASTER_DATA_ROLES });
  const canManageMasterData = user?.role?.name === "ADMIN";
  const [editingSupervisorId, setEditingSupervisorId] = useState<string | null>(null);
  const [form, setForm] = useState({
    supervisorNumber: "",
    fullName: "",
    email: "",
    phone: "",
    password: "",
  });
  const [editForm, setEditForm] = useState({
    supervisorNumber: "",
    fullName: "",
    email: "",
    phone: "",
    isActive: "true",
  });

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
      const payload = {
        supervisorNumber: form.supervisorNumber,
        fullName: form.fullName,
        email: form.email,
        phone: form.phone || undefined,
        password: form.password,
      };

      const { data } = await api.post<Supervisor>("/master-data/supervisors", payload);
      return data;
    },
    onSuccess: () => {
      setForm({
        supervisorNumber: "",
        fullName: "",
        email: "",
        phone: "",
        password: "",
      });
      queryClient.invalidateQueries({ queryKey: ["master-data", "supervisors"] });
    },
  });

  const updateSupervisorMutation = useMutation({
    mutationFn: async () => {
      if (!editingSupervisorId) {
        throw new Error("No supervisor selected");
      }

      const payload = {
        supervisorNumber: editForm.supervisorNumber,
        fullName: editForm.fullName,
        email: editForm.email,
        phone: editForm.phone || undefined,
        isActive: editForm.isActive === "true",
      };

      const { data } = await api.patch<Supervisor>(
        `/master-data/supervisors/${editingSupervisorId}`,
        payload,
      );
      return data;
    },
    onSuccess: () => {
      setEditingSupervisorId(null);
      queryClient.invalidateQueries({ queryKey: ["master-data", "supervisors"] });
    },
  });

  const deleteSupervisorMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete<Supervisor>(`/master-data/supervisors/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["master-data", "supervisors"] });
    },
  });

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateEditField(field: keyof typeof editForm, value: string) {
    setEditForm((current) => ({ ...current, [field]: value }));
  }

  function startEdit(supervisor: Supervisor) {
    setEditingSupervisorId(supervisor.id);
    setEditForm({
      supervisorNumber: supervisor.supervisorNumber,
      fullName: supervisor.user.fullName,
      email: supervisor.user.email,
      phone: supervisor.user.phone || "",
      isActive: String(supervisor.user.isActive),
    });
  }

  function cancelEdit() {
    setEditingSupervisorId(null);
  }

  function deleteSupervisor(supervisor: Supervisor) {
    const confirmed = window.confirm(`Hapus supervisor ${supervisor.user.fullName}?`);

    if (!confirmed) {
      return;
    }

    deleteSupervisorMutation.mutate(supervisor.id);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createSupervisorMutation.mutate();
  }

  return (
    <AdminShell
      title="Supervisors"
      description="Kelola akun supervisor lapangan."
      user={user}
    >
      <div
        className={
          canManageMasterData ? "grid gap-4 xl:grid-cols-[380px_1fr]" : "grid gap-4"
        }
      >
        {canManageMasterData ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Tambah Supervisor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="supervisorNumber">Nomor Supervisor</Label>
                <Input
                  id="supervisorNumber"
                  value={form.supervisorNumber}
                  onChange={(event) =>
                    updateField("supervisorNumber", event.target.value)
                  }
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
              {createSupervisorMutation.isError ? (
                <p className="text-sm text-red-600">Gagal menambah supervisor.</p>
              ) : null}
              <Button
                className="w-full"
                type="submit"
                disabled={createSupervisorMutation.isPending}
              >
                {createSupervisorMutation.isPending
                  ? "Menyimpan..."
                  : "Simpan Supervisor"}
              </Button>
            </form>
          </CardContent>
        </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Daftar Supervisor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] border-collapse text-sm">
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
                  {supervisorsQuery.data?.map((supervisor) => {
                    const isEditing =
                      canManageMasterData && editingSupervisorId === supervisor.id;

                    return (
                      <tr key={supervisor.id} className="border-b border-neutral-100">
                        <td className="py-3 pr-4 font-medium">
                          {isEditing ? (
                            <Input
                              value={editForm.supervisorNumber}
                              onChange={(event) =>
                                updateEditField("supervisorNumber", event.target.value)
                              }
                              className="w-36"
                            />
                          ) : (
                            supervisor.supervisorNumber
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          {isEditing ? (
                            <Input
                              value={editForm.fullName}
                              onChange={(event) =>
                                updateEditField("fullName", event.target.value)
                              }
                              className="min-w-48"
                            />
                          ) : (
                            supervisor.user.fullName
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          {isEditing ? (
                            <Input
                              type="email"
                              value={editForm.email}
                              onChange={(event) => updateEditField("email", event.target.value)}
                              className="min-w-56"
                            />
                          ) : (
                            supervisor.user.email
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          {isEditing ? (
                            <Input
                              value={editForm.phone}
                              onChange={(event) => updateEditField("phone", event.target.value)}
                              className="w-40"
                            />
                          ) : (
                            supervisor.user.phone || "-"
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
                            <StatusBadge status={supervisor.user.isActive} />
                          )}
                        </td>
                        {canManageMasterData ? (
                          <td className="py-3 pr-4">
                            {isEditing ? (
                              <div className="flex gap-2">
                                <Button
                                  className="h-9 w-9 px-0"
                                  onClick={() => updateSupervisorMutation.mutate()}
                                  disabled={updateSupervisorMutation.isPending}
                                  aria-label="Simpan perubahan"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  className="h-9 w-9 px-0"
                                  variant="outline"
                                  onClick={cancelEdit}
                                  disabled={updateSupervisorMutation.isPending}
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
                                  onClick={() => startEdit(supervisor)}
                                  aria-label="Edit supervisor"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  className="h-9 w-9 px-0 text-red-600 hover:bg-red-50"
                                  variant="outline"
                                  onClick={() => deleteSupervisor(supervisor)}
                                  disabled={deleteSupervisorMutation.isPending}
                                  aria-label="Hapus supervisor"
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
                  {!supervisorsQuery.isLoading && !supervisorsQuery.data?.length ? (
                    <tr>
                      <td className="py-6 text-neutral-500" colSpan={canManageMasterData ? 6 : 5}>
                        Belum ada supervisor.
                      </td>
                    </tr>
                  ) : null}
                  {supervisorsQuery.isLoading ? (
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

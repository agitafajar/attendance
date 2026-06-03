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
import { api } from "@/lib/api";

const MASTER_DATA_ROLES = ["ADMIN", "SUPERVISOR"] as const;

type Supervisor = {
  id: string;
  supervisorNumber: string;
  user: {
    fullName: string;
  };
};

type Employee = {
  id: string;
  employeeNumber: string;
  position?: string | null;
  employmentStatus?: string | null;
  user: {
    email: string;
    fullName: string;
    phone?: string | null;
  };
  supervisor?: Supervisor | null;
};

export default function EmployeesPage() {
  const queryClient = useQueryClient();
  const { user, isReady } = useAuthGuard({ allowedRoles: MASTER_DATA_ROLES });
  const canManageMasterData = user?.role?.name === "ADMIN";
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);
  const [form, setForm] = useState({
    employeeNumber: "",
    supervisorId: "",
    fullName: "",
    email: "",
    phone: "",
    password: "",
    position: "",
    joinDate: "",
    employmentStatus: "CONTRACT",
  });
  const [editForm, setEditForm] = useState({
    supervisorId: "",
    position: "",
    employmentStatus: "",
  });

  const supervisorsQuery = useQuery({
    queryKey: ["master-data", "supervisors"],
    queryFn: async () => {
      const { data } = await api.get<Supervisor[]>("/master-data/supervisors");
      return data;
    },
    enabled: isReady,
  });

  const employeesQuery = useQuery({
    queryKey: ["master-data", "employees"],
    queryFn: async () => {
      const { data } = await api.get<Employee[]>("/master-data/employees");
      return data;
    },
    enabled: isReady,
  });

  const createEmployeeMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        employeeNumber: form.employeeNumber,
        supervisorId: form.supervisorId || undefined,
        fullName: form.fullName,
        email: form.email,
        phone: form.phone || undefined,
        password: form.password,
        position: form.position || undefined,
        joinDate: form.joinDate || undefined,
        employmentStatus: form.employmentStatus || undefined,
      };

      const { data } = await api.post<Employee>("/master-data/employees", payload);
      return data;
    },
    onSuccess: () => {
      setForm({
        employeeNumber: "",
        supervisorId: "",
        fullName: "",
        email: "",
        phone: "",
        password: "",
        position: "",
        joinDate: "",
        employmentStatus: "CONTRACT",
      });
      queryClient.invalidateQueries({ queryKey: ["master-data", "employees"] });
    },
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: async () => {
      if (!editingEmployeeId) {
        throw new Error("No employee selected");
      }

      const payload = {
        supervisorId: editForm.supervisorId || undefined,
        position: editForm.position || undefined,
        employmentStatus: editForm.employmentStatus || undefined,
      };

      const { data } = await api.patch<Employee>(
        `/master-data/employees/${editingEmployeeId}`,
        payload,
      );
      return data;
    },
    onSuccess: () => {
      setEditingEmployeeId(null);
      queryClient.invalidateQueries({ queryKey: ["master-data", "employees"] });
    },
  });

  const deleteEmployeeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete<Employee>(`/master-data/employees/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["master-data", "employees"] });
    },
  });

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateEditField(field: keyof typeof editForm, value: string) {
    setEditForm((current) => ({ ...current, [field]: value }));
  }

  function startEdit(employee: Employee) {
    setEditingEmployeeId(employee.id);
    setEditForm({
      supervisorId: employee.supervisor?.id || "",
      position: employee.position || "",
      employmentStatus: employee.employmentStatus || "",
    });
  }

  function cancelEdit() {
    setEditingEmployeeId(null);
  }

  function deleteEmployee(employee: Employee) {
    const confirmed = window.confirm(`Hapus employee ${employee.user.fullName}?`);

    if (!confirmed) {
      return;
    }

    deleteEmployeeMutation.mutate(employee.id);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createEmployeeMutation.mutate();
  }

  return (
    <AdminShell
      title="Employees"
      description="Kelola akun dan profil karyawan alih daya."
      user={user}
    >
      <div
        className={
          canManageMasterData ? "grid gap-4 xl:grid-cols-[400px_1fr]" : "grid gap-4"
        }
      >
        {canManageMasterData ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Tambah Employee
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="employeeNumber">Nomor Employee</Label>
                <Input
                  id="employeeNumber"
                  value={form.employeeNumber}
                  onChange={(event) => updateField("employeeNumber", event.target.value)}
                  placeholder="EMP-002"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supervisorId">Supervisor</Label>
                <Select
                  id="supervisorId"
                  value={form.supervisorId}
                  onChange={(event) => updateField("supervisorId", event.target.value)}
                >
                  <option value="">Tanpa supervisor</option>
                  {supervisorsQuery.data?.map((supervisor) => (
                    <option key={supervisor.id} value={supervisor.id}>
                      {supervisor.supervisorNumber} - {supervisor.user.fullName}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fullName">Nama Lengkap</Label>
                <Input
                  id="fullName"
                  value={form.fullName}
                  onChange={(event) => updateField("fullName", event.target.value)}
                  placeholder="Nama Karyawan"
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
                  placeholder="employee@company.test"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
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
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={form.password}
                    onChange={(event) => updateField("password", event.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="position">Posisi</Label>
                  <Input
                    id="position"
                    value={form.position}
                    onChange={(event) => updateField("position", event.target.value)}
                    placeholder="Security"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="joinDate">Tanggal Masuk</Label>
                  <Input
                    id="joinDate"
                    type="date"
                    value={form.joinDate}
                    onChange={(event) => updateField("joinDate", event.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="employmentStatus">Status Kerja</Label>
                <Input
                  id="employmentStatus"
                  value={form.employmentStatus}
                  onChange={(event) =>
                    updateField("employmentStatus", event.target.value)
                  }
                  placeholder="CONTRACT"
                />
              </div>
              {createEmployeeMutation.isError ? (
                <p className="text-sm text-red-600">Gagal menambah employee.</p>
              ) : null}
              <Button
                className="w-full"
                type="submit"
                disabled={createEmployeeMutation.isPending}
              >
                {createEmployeeMutation.isPending ? "Menyimpan..." : "Simpan Employee"}
              </Button>
            </form>
          </CardContent>
        </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Daftar Employee
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1080px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 text-left text-neutral-500">
                    <th className="py-3 pr-4 font-medium">Nomor</th>
                    <th className="py-3 pr-4 font-medium">Nama</th>
                    <th className="py-3 pr-4 font-medium">Kontak</th>
                    <th className="py-3 pr-4 font-medium">Supervisor</th>
                    <th className="py-3 pr-4 font-medium">Posisi</th>
                    <th className="py-3 pr-4 font-medium">Status</th>
                    {canManageMasterData ? (
                      <th className="py-3 pr-4 font-medium">Aksi</th>
                    ) : null}
                  </tr>
                </thead>
                <tbody>
                  {employeesQuery.data?.map((employee) => {
                    const isEditing = canManageMasterData && editingEmployeeId === employee.id;

                    return (
                      <tr key={employee.id} className="border-b border-neutral-100">
                        <td className="py-3 pr-4 font-medium">
                          {employee.employeeNumber}
                        </td>
                        <td className="py-3 pr-4">{employee.user.fullName}</td>
                        {canManageMasterData ? (
                        <td className="py-3 pr-4">
                          <p>{employee.user.email}</p>
                          <p className="mt-1 text-xs text-neutral-500">
                            {employee.user.phone || "-"}
                          </p>
                        </td>
                        ) : null}
                        <td className="py-3 pr-4">
                          {isEditing ? (
                            <Select
                              value={editForm.supervisorId}
                              onChange={(event) =>
                                updateEditField("supervisorId", event.target.value)
                              }
                              className="min-w-52"
                            >
                              <option value="">Tanpa supervisor</option>
                              {supervisorsQuery.data?.map((supervisor) => (
                                <option key={supervisor.id} value={supervisor.id}>
                                  {supervisor.supervisorNumber} - {supervisor.user.fullName}
                                </option>
                              ))}
                            </Select>
                          ) : (
                            employee.supervisor?.user.fullName || "-"
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          {isEditing ? (
                            <Input
                              value={editForm.position}
                              onChange={(event) =>
                                updateEditField("position", event.target.value)
                              }
                              className="w-40"
                            />
                          ) : (
                            employee.position || "-"
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          {isEditing ? (
                            <Input
                              value={editForm.employmentStatus}
                              onChange={(event) =>
                                updateEditField("employmentStatus", event.target.value)
                              }
                              className="w-40"
                            />
                          ) : (
                            employee.employmentStatus || "-"
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          {isEditing ? (
                            <div className="flex gap-2">
                              <Button
                                className="h-9 w-9 px-0"
                                onClick={() => updateEmployeeMutation.mutate()}
                                disabled={updateEmployeeMutation.isPending}
                                aria-label="Simpan perubahan"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                className="h-9 w-9 px-0"
                                variant="outline"
                                onClick={cancelEdit}
                                disabled={updateEmployeeMutation.isPending}
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
                                onClick={() => startEdit(employee)}
                                aria-label="Edit employee"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                className="h-9 w-9 px-0 text-red-600 hover:bg-red-50"
                                variant="outline"
                                onClick={() => deleteEmployee(employee)}
                                disabled={deleteEmployeeMutation.isPending}
                                aria-label="Hapus employee"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {!employeesQuery.isLoading && !employeesQuery.data?.length ? (
                    <tr>
                      <td className="py-6 text-neutral-500" colSpan={canManageMasterData ? 7 : 6}>
                        Belum ada employee.
                      </td>
                    </tr>
                  ) : null}
                  {employeesQuery.isLoading ? (
                    <tr>
                      <td className="py-6 text-neutral-500" colSpan={canManageMasterData ? 7 : 6}>
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

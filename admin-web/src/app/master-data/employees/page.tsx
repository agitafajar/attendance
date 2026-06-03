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
import { EmptyTableRow, ErrorTableRow, FormError, LoadingTableRow } from "@/components/ui/table-state";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api";

const MASTER_DATA_ROLES = ["ADMIN"] as const;

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

type EmployeeForm = {
  employeeNumber: string;
  supervisorId: string;
  fullName: string;
  email: string;
  phone: string;
  password: string;
  position: string;
  joinDate: string;
  employmentStatus: string;
};

type ConfirmState =
  | { action: "delete"; employee: Employee }
  | null;

const emptyForm: EmployeeForm = {
  employeeNumber: "",
  supervisorId: "",
  fullName: "",
  email: "",
  phone: "",
  password: "",
  position: "",
  joinDate: "",
  employmentStatus: "CONTRACT",
};

export default function EmployeesPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { user, isReady } = useAuthGuard({ allowedRoles: MASTER_DATA_ROLES });
  const canManageMasterData = user?.role?.name === "ADMIN";
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [form, setForm] = useState<EmployeeForm>(emptyForm);
  const [confirmState, setConfirmState] = useState<ConfirmState>(null);

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
      const { data } = await api.post<Employee>(
        "/master-data/employees",
        buildCreatePayload(form),
      );
      return data;
    },
    onSuccess: () => {
      closeModal();
      setConfirmState(null);
      queryClient.invalidateQueries({ queryKey: ["master-data", "employees"] });
      showToast({ title: "Employee berhasil ditambahkan", tone: "success" });
    },
    onError: () => {
      setConfirmState(null);
      showToast({ title: "Gagal menambah employee", tone: "error" });
    },
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: async () => {
      if (!selectedEmployeeId) {
        throw new Error("No employee selected");
      }

      const { data } = await api.patch<Employee>(
        `/master-data/employees/${selectedEmployeeId}`,
        buildUpdatePayload(form),
      );
      return data;
    },
    onSuccess: () => {
      closeModal();
      setConfirmState(null);
      queryClient.invalidateQueries({ queryKey: ["master-data", "employees"] });
      showToast({ title: "Employee berhasil diperbarui", tone: "success" });
    },
    onError: () => {
      setConfirmState(null);
      showToast({ title: "Gagal memperbarui employee", tone: "error" });
    },
  });

  const deleteEmployeeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete<Employee>(`/master-data/employees/${id}`);
      return data;
    },
    onSuccess: () => {
      setConfirmState(null);
      queryClient.invalidateQueries({ queryKey: ["master-data", "employees"] });
      showToast({ title: "Employee berhasil dihapus", tone: "success" });
    },
    onError: () => {
      setConfirmState(null);
      showToast({ title: "Gagal menghapus employee", tone: "error" });
    },
  });

  const isMutating =
    createEmployeeMutation.isPending ||
    updateEmployeeMutation.isPending ||
    deleteEmployeeMutation.isPending;

  function updateField(field: keyof EmployeeForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function openCreateModal() {
    setSelectedEmployeeId(null);
    setForm(emptyForm);
    setModalMode("create");
  }

  function openEditModal(employee: Employee) {
    setSelectedEmployeeId(employee.id);
    setForm({
      ...emptyForm,
      employeeNumber: employee.employeeNumber,
      supervisorId: employee.supervisor?.id || "",
      fullName: employee.user.fullName,
      email: employee.user.email,
      phone: employee.user.phone || "",
      position: employee.position || "",
      employmentStatus: employee.employmentStatus || "",
    });
    setModalMode("edit");
  }

  function closeModal() {
    if (isMutating) return;
    setModalMode(null);
    setSelectedEmployeeId(null);
    setForm(emptyForm);
  }

  function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (modalMode === "edit") {
      updateEmployeeMutation.mutate();
      return;
    }

    createEmployeeMutation.mutate();
  }

  function confirmAction() {
    if (confirmState?.action === "delete") {
      deleteEmployeeMutation.mutate(confirmState.employee.id);
    }
  }

  return (
    <AdminShell
      title="Employees"
      description="Kelola akun dan profil karyawan alih daya."
      user={user}
    >
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Daftar Employee
              </CardTitle>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                Karyawan aktif, supervisor, posisi, dan status kerja.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-[var(--muted)]">
                {employeesQuery.data?.length ?? 0} employee
              </span>
              {canManageMasterData ? (
                <Button onClick={openCreateModal}>
                  <Plus className="h-4 w-4" />
                  Employee
                </Button>
              ) : null}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] border-collapse text-sm">
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
                {employeesQuery.data?.map((employee) => (
                  <tr key={employee.id} className="border-b border-neutral-100">
                    <td className="py-3 pr-4 font-medium">{employee.employeeNumber}</td>
                    <td className="py-3 pr-4">{employee.user.fullName}</td>
                    <td className="py-3 pr-4">
                      <p>{employee.user.email}</p>
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        {employee.user.phone || "-"}
                      </p>
                    </td>
                    <td className="py-3 pr-4">
                      {employee.supervisor?.user.fullName || "-"}
                    </td>
                    <td className="py-3 pr-4">{employee.position || "-"}</td>
                    <td className="py-3 pr-4">{employee.employmentStatus || "-"}</td>
                    {canManageMasterData ? (
                      <td className="py-3 pr-4">
                        <div className="flex gap-2">
                          <Button
                            className="h-9 w-9 px-0"
                            variant="outline"
                            onClick={() => openEditModal(employee)}
                            aria-label="Edit employee"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            className="h-9 w-9 border-red-200 px-0 text-red-700 hover:border-red-300 hover:bg-red-50"
                            variant="outline"
                            onClick={() => setConfirmState({ action: "delete", employee })}
                            disabled={deleteEmployeeMutation.isPending}
                            aria-label="Hapus employee"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))}
                {!employeesQuery.isLoading && !employeesQuery.isError && !employeesQuery.data?.length ? (
                  <EmptyTableRow colSpan={canManageMasterData ? 7 : 6}>
                    Belum ada employee.
                  </EmptyTableRow>
                ) : null}
                {employeesQuery.isLoading ? (
                  <LoadingTableRow colSpan={canManageMasterData ? 7 : 6} />
                ) : null}
                {employeesQuery.isError ? (
                  <ErrorTableRow
                    colSpan={canManageMasterData ? 7 : 6}
                    title="Employee gagal dimuat"
                    description="Data employee belum bisa ditampilkan. Coba muat ulang beberapa saat lagi."
                    onRetry={() => employeesQuery.refetch()}
                  />
                ) : null}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Modal
        open={Boolean(modalMode)}
        title={modalMode === "edit" ? "Edit Employee" : "Tambah Employee"}
        description="Data employee cukup panjang, gunakan scroll di dalam modal bila diperlukan."
        size="xl"
        onClose={closeModal}
        footer={
          <>
            <Button variant="outline" onClick={closeModal} disabled={isMutating}>
              Batal
            </Button>
            <Button type="submit" form="employee-form" disabled={isMutating}>
              {isMutating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {modalMode === "edit" ? "Simpan Perubahan" : "Simpan Employee"}
            </Button>
          </>
        }
      >
        <form id="employee-form" className="space-y-4" onSubmit={submitForm}>
          {modalMode === "create" ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
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
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
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
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
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
              <div className="grid gap-4 sm:grid-cols-3">
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
                <div className="space-y-2">
                  <Label htmlFor="employmentStatus">Status Kerja</Label>
                  <Input
                    id="employmentStatus"
                    value={form.employmentStatus}
                    onChange={(event) => updateField("employmentStatus", event.target.value)}
                    placeholder="CONTRACT"
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="rounded-md border border-[var(--border)] bg-[#f8faf9] p-3 text-sm text-[var(--muted-strong)]">
                <p className="font-semibold text-[var(--foreground)]">
                  {form.employeeNumber} - {form.fullName}
                </p>
                <p className="mt-1">{form.email}</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="editSupervisorId">Supervisor</Label>
                  <Select
                    id="editSupervisorId"
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
                  <Label htmlFor="editPosition">Posisi</Label>
                  <Input
                    id="editPosition"
                    value={form.position}
                    onChange={(event) => updateField("position", event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editEmploymentStatus">Status Kerja</Label>
                  <Input
                    id="editEmploymentStatus"
                    value={form.employmentStatus}
                    onChange={(event) => updateField("employmentStatus", event.target.value)}
                  />
                </div>
              </div>
            </>
          )}
          {createEmployeeMutation.isError && modalMode === "create" ? (
            <FormError>Gagal menambah employee.</FormError>
          ) : null}
          {updateEmployeeMutation.isError && modalMode === "edit" ? (
            <FormError>Gagal memperbarui employee.</FormError>
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

function buildCreatePayload(form: EmployeeForm) {
  return {
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
}

function buildUpdatePayload(form: EmployeeForm) {
  return {
    supervisorId: form.supervisorId || undefined,
    position: form.position || undefined,
    employmentStatus: form.employmentStatus || undefined,
  };
}

function getConfirmTitle(confirmState: ConfirmState) {
  return confirmState?.action === "delete" ? "Hapus employee?" : "";
}

function getConfirmDescription(confirmState: ConfirmState) {
  if (confirmState?.action === "delete") {
    return `Employee ${confirmState.employee.user.fullName} akan dihapus dari master data.`;
  }

  return "";
}

function getConfirmText(confirmState: ConfirmState) {
  return confirmState?.action === "delete" ? "Hapus Employee" : "Konfirmasi";
}

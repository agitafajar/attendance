"use client";

import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardCheck, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
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

type Employee = {
  id: string;
  employeeNumber: string;
  user: {
    fullName: string;
  };
};

type Client = {
  id: string;
  code: string;
  name: string;
};

type WorkLocation = {
  id: string;
  clientId: string;
  name: string;
  client: Client;
};

type Shift = {
  id: string;
  code: string;
  name: string;
};

type Assignment = {
  id: string;
  startDate: string;
  endDate?: string | null;
  isActive: boolean;
  employee: Employee;
  client: Client;
  workLocation: WorkLocation;
  shift: Shift;
};

type AssignmentForm = {
  employeeId: string;
  clientId: string;
  workLocationId: string;
  shiftId: string;
  startDate: string;
  endDate: string;
  isActive: string;
};

type ConfirmState =
  | { action: "delete"; assignment: Assignment }
  | null;

const emptyForm: AssignmentForm = {
  employeeId: "",
  clientId: "",
  workLocationId: "",
  shiftId: "",
  startDate: "",
  endDate: "",
  isActive: "true",
};

export default function AssignmentsPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { user, isReady } = useAuthGuard({ allowedRoles: MASTER_DATA_ROLES });
  const canManageMasterData = user?.role?.name === "ADMIN";
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [form, setForm] = useState<AssignmentForm>(emptyForm);
  const [confirmState, setConfirmState] = useState<ConfirmState>(null);

  const employeesQuery = useQuery({
    queryKey: ["master-data", "employees"],
    queryFn: async () => {
      const { data } = await api.get<Employee[]>("/master-data/employees");
      return data;
    },
    enabled: isReady,
  });

  const clientsQuery = useQuery({
    queryKey: ["master-data", "clients"],
    queryFn: async () => {
      const { data } = await api.get<Client[]>("/master-data/clients");
      return data;
    },
    enabled: isReady,
  });

  const locationsQuery = useQuery({
    queryKey: ["master-data", "work-locations"],
    queryFn: async () => {
      const { data } = await api.get<WorkLocation[]>("/master-data/work-locations");
      return data;
    },
    enabled: isReady,
  });

  const shiftsQuery = useQuery({
    queryKey: ["master-data", "shifts"],
    queryFn: async () => {
      const { data } = await api.get<Shift[]>("/master-data/shifts");
      return data;
    },
    enabled: isReady,
  });

  const assignmentsQuery = useQuery({
    queryKey: ["master-data", "assignments"],
    queryFn: async () => {
      const { data } = await api.get<Assignment[]>("/master-data/assignments");
      return data;
    },
    enabled: isReady,
  });

  const selectedClientId = form.clientId || clientsQuery.data?.[0]?.id || "";
  const filteredLocations = useMemo(() => {
    return (locationsQuery.data ?? []).filter(
      (location) => location.clientId === selectedClientId,
    );
  }, [locationsQuery.data, selectedClientId]);

  const selectedLocationId = form.workLocationId || filteredLocations[0]?.id || "";
  const selectedEmployeeId = form.employeeId || employeesQuery.data?.[0]?.id || "";
  const selectedShiftId = form.shiftId || shiftsQuery.data?.[0]?.id || "";

  const createAssignmentMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<Assignment>(
        "/master-data/assignments",
        buildPayload(form, {
          employeeId: selectedEmployeeId,
          clientId: selectedClientId,
          workLocationId: selectedLocationId,
          shiftId: selectedShiftId,
        }, false),
      );
      return data;
    },
    onSuccess: () => {
      closeModal();
      setConfirmState(null);
      queryClient.invalidateQueries({ queryKey: ["master-data", "assignments"] });
      showToast({ title: "Assignment berhasil ditambahkan", tone: "success" });
    },
    onError: () => {
      setConfirmState(null);
      showToast({ title: "Gagal menambah assignment", tone: "error" });
    },
  });

  const updateAssignmentMutation = useMutation({
    mutationFn: async () => {
      if (!selectedAssignmentId) {
        throw new Error("No assignment selected");
      }

      const { data } = await api.patch<Assignment>(
        `/master-data/assignments/${selectedAssignmentId}`,
        buildPayload(form, {
          employeeId: selectedEmployeeId,
          clientId: selectedClientId,
          workLocationId: selectedLocationId,
          shiftId: selectedShiftId,
        }, true),
      );
      return data;
    },
    onSuccess: () => {
      closeModal();
      setConfirmState(null);
      queryClient.invalidateQueries({ queryKey: ["master-data", "assignments"] });
      showToast({ title: "Assignment berhasil diperbarui", tone: "success" });
    },
    onError: () => {
      setConfirmState(null);
      showToast({ title: "Gagal memperbarui assignment", tone: "error" });
    },
  });

  const deleteAssignmentMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete<Assignment>(`/master-data/assignments/${id}`);
      return data;
    },
    onSuccess: () => {
      setConfirmState(null);
      queryClient.invalidateQueries({ queryKey: ["master-data", "assignments"] });
      showToast({ title: "Assignment berhasil dihapus", tone: "success" });
    },
    onError: () => {
      setConfirmState(null);
      showToast({ title: "Gagal menghapus assignment", tone: "error" });
    },
  });

  const canSubmit =
    selectedEmployeeId &&
    selectedClientId &&
    selectedLocationId &&
    selectedShiftId &&
    form.startDate;

  const isMutating =
    createAssignmentMutation.isPending ||
    updateAssignmentMutation.isPending ||
    deleteAssignmentMutation.isPending;

  function updateField(field: keyof AssignmentForm, value: string) {
    setForm((current) => {
      if (field === "clientId") {
        const nextLocationId =
          locationsQuery.data?.find((location) => location.clientId === value)?.id || "";

        return { ...current, clientId: value, workLocationId: nextLocationId };
      }

      return { ...current, [field]: value };
    });
  }

  function openCreateModal() {
    const clientId = clientsQuery.data?.[0]?.id || "";
    const workLocationId =
      locationsQuery.data?.find((location) => location.clientId === clientId)?.id || "";

    setSelectedAssignmentId(null);
    setForm({
      ...emptyForm,
      employeeId: employeesQuery.data?.[0]?.id || "",
      clientId,
      workLocationId,
      shiftId: shiftsQuery.data?.[0]?.id || "",
    });
    setModalMode("create");
  }

  function openEditModal(assignment: Assignment) {
    setSelectedAssignmentId(assignment.id);
    setForm({
      employeeId: assignment.employee.id,
      clientId: assignment.client.id,
      workLocationId: assignment.workLocation.id,
      shiftId: assignment.shift.id,
      startDate: formatDate(assignment.startDate),
      endDate: assignment.endDate ? formatDate(assignment.endDate) : "",
      isActive: String(assignment.isActive),
    });
    setModalMode("edit");
  }

  function closeModal() {
    if (isMutating) return;
    setModalMode(null);
    setSelectedAssignmentId(null);
    setForm(emptyForm);
  }

  function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (modalMode === "edit") {
      updateAssignmentMutation.mutate();
      return;
    }

    createAssignmentMutation.mutate();
  }

  function confirmAction() {
    if (confirmState?.action === "delete") {
      deleteAssignmentMutation.mutate(confirmState.assignment.id);
    }
  }

  const canOpenCreate =
    Boolean(employeesQuery.data?.length) &&
    Boolean(clientsQuery.data?.length) &&
    Boolean(locationsQuery.data?.length) &&
    Boolean(shiftsQuery.data?.length);

  return (
    <AdminShell
      title="Assignments"
      description="Hubungkan karyawan dengan client, lokasi kerja, dan shift."
      user={user}
    >
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4" />
                Daftar Assignment
              </CardTitle>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                Relasi employee, client, lokasi, shift, dan periode kerja aktif.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-[var(--muted)]">
                {assignmentsQuery.data?.length ?? 0} assignment
              </span>
              {canManageMasterData ? (
                <Button onClick={openCreateModal} disabled={!canOpenCreate}>
                  <Plus className="h-4 w-4" />
                  Assignment
                </Button>
              ) : null}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-left text-neutral-500">
                  <th className="py-3 pr-4 font-medium">Employee</th>
                  <th className="py-3 pr-4 font-medium">Client</th>
                  <th className="py-3 pr-4 font-medium">Lokasi</th>
                  <th className="py-3 pr-4 font-medium">Shift</th>
                  <th className="py-3 pr-4 font-medium">Periode</th>
                  <th className="py-3 pr-4 font-medium">Status</th>
                  {canManageMasterData ? (
                    <th className="py-3 pr-4 font-medium">Aksi</th>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {assignmentsQuery.data?.map((assignment) => (
                  <tr key={assignment.id} className="border-b border-neutral-100">
                    <td className="py-3 pr-4">
                      {assignment.employee.employeeNumber} -{" "}
                      {assignment.employee.user.fullName}
                    </td>
                    <td className="py-3 pr-4">{assignment.client.name}</td>
                    <td className="py-3 pr-4">{assignment.workLocation.name}</td>
                    <td className="py-3 pr-4">{assignment.shift.name}</td>
                    <td className="py-3 pr-4">
                      {formatDate(assignment.startDate)} -{" "}
                      {assignment.endDate ? formatDate(assignment.endDate) : "Sekarang"}
                    </td>
                    <td className="py-3 pr-4">
                      <StatusBadge status={assignment.isActive} />
                    </td>
                    {canManageMasterData ? (
                      <td className="py-3 pr-4">
                        <div className="flex gap-2">
                          <Button
                            className="h-9 w-9 px-0"
                            variant="outline"
                            onClick={() => openEditModal(assignment)}
                            aria-label="Edit assignment"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            className="h-9 w-9 border-red-200 px-0 text-red-700 hover:border-red-300 hover:bg-red-50"
                            variant="outline"
                            onClick={() => setConfirmState({ action: "delete", assignment })}
                            disabled={deleteAssignmentMutation.isPending}
                            aria-label="Hapus assignment"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))}
                {!assignmentsQuery.isLoading && !assignmentsQuery.isError && !assignmentsQuery.data?.length ? (
                  <EmptyTableRow colSpan={canManageMasterData ? 7 : 6}>
                    Belum ada assignment.
                  </EmptyTableRow>
                ) : null}
                {assignmentsQuery.isLoading ? (
                  <LoadingTableRow colSpan={canManageMasterData ? 7 : 6} />
                ) : null}
                {assignmentsQuery.isError ? (
                  <ErrorTableRow
                    colSpan={canManageMasterData ? 7 : 6}
                    title="Assignment gagal dimuat"
                    description="Data assignment belum bisa ditampilkan. Coba muat ulang beberapa saat lagi."
                    onRetry={() => assignmentsQuery.refetch()}
                  />
                ) : null}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Modal
        open={Boolean(modalMode)}
        title={modalMode === "edit" ? "Edit Assignment" : "Tambah Assignment"}
        description="Pilih employee, client, lokasi, shift, dan periode assignment."
        size="xl"
        onClose={closeModal}
        footer={
          <>
            <Button variant="outline" onClick={closeModal} disabled={isMutating}>
              Batal
            </Button>
            <Button type="submit" form="assignment-form" disabled={!canSubmit || isMutating}>
              {isMutating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {modalMode === "edit" ? "Simpan Perubahan" : "Simpan Assignment"}
            </Button>
          </>
        }
      >
        <form id="assignment-form" className="space-y-4" onSubmit={submitForm}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="employeeId">Employee</Label>
              <Select
                id="employeeId"
                value={selectedEmployeeId}
                onChange={(event) => updateField("employeeId", event.target.value)}
                required
              >
                {!employeesQuery.data?.length ? (
                  <option value="">Belum ada employee</option>
                ) : null}
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
                value={selectedClientId}
                onChange={(event) => updateField("clientId", event.target.value)}
                required
              >
                {!clientsQuery.data?.length ? (
                  <option value="">Belum ada client</option>
                ) : null}
                {clientsQuery.data?.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.code} - {client.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="workLocationId">Work Location</Label>
              <Select
                id="workLocationId"
                value={selectedLocationId}
                onChange={(event) => updateField("workLocationId", event.target.value)}
                required
              >
                {!filteredLocations.length ? (
                  <option value="">Belum ada lokasi untuk client ini</option>
                ) : null}
                {filteredLocations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="shiftId">Shift</Label>
              <Select
                id="shiftId"
                value={selectedShiftId}
                onChange={(event) => updateField("shiftId", event.target.value)}
                required
              >
                {!shiftsQuery.data?.length ? <option value="">Belum ada shift</option> : null}
                {shiftsQuery.data?.map((shift) => (
                  <option key={shift.id} value={shift.id}>
                    {shift.code} - {shift.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="startDate">Mulai</Label>
              <Input
                id="startDate"
                type="date"
                value={form.startDate}
                onChange={(event) => updateField("startDate", event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Selesai</Label>
              <Input
                id="endDate"
                type="date"
                value={form.endDate}
                onChange={(event) => updateField("endDate", event.target.value)}
              />
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
          </div>
          {createAssignmentMutation.isError && modalMode === "create" ? (
            <FormError>Gagal menambah assignment.</FormError>
          ) : null}
          {updateAssignmentMutation.isError && modalMode === "edit" ? (
            <FormError>Gagal memperbarui assignment.</FormError>
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

function buildPayload(
  form: AssignmentForm,
  selected: {
    employeeId: string;
    clientId: string;
    workLocationId: string;
    shiftId: string;
  },
  includeActive: boolean,
) {
  const payload: {
    employeeId: string;
    clientId: string;
    workLocationId: string;
    shiftId: string;
    startDate: string;
    endDate?: string;
    isActive?: boolean;
  } = {
    employeeId: selected.employeeId,
    clientId: selected.clientId,
    workLocationId: selected.workLocationId,
    shiftId: selected.shiftId,
    startDate: form.startDate,
    endDate: form.endDate || undefined,
  };

  if (includeActive) {
    payload.isActive = form.isActive === "true";
  }

  return payload;
}

function getConfirmTitle(confirmState: ConfirmState) {
  return confirmState?.action === "delete" ? "Hapus assignment?" : "";
}

function getConfirmDescription(confirmState: ConfirmState) {
  if (confirmState?.action === "delete") {
    return `Assignment ${confirmState.assignment.employee.employeeNumber} - ${confirmState.assignment.client.name} akan dihapus.`;
  }

  return "";
}

function getConfirmText(confirmState: ConfirmState) {
  return confirmState?.action === "delete" ? "Hapus Assignment" : "Konfirmasi";
}

function formatDate(value: string) {
  return value.slice(0, 10);
}

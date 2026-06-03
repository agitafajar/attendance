"use client";

import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ClipboardCheck, Pencil, Plus, Trash2, X } from "lucide-react";
import { AdminShell } from "@/components/app/admin-shell";
import { useAuthGuard } from "@/components/app/use-auth-guard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { api } from "@/lib/api";

const MASTER_DATA_ROLES = ["ADMIN", "SUPERVISOR"] as const;

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

export default function AssignmentsPage() {
  const queryClient = useQueryClient();
  const { user, isReady } = useAuthGuard({ allowedRoles: MASTER_DATA_ROLES });
  const canManageMasterData = user?.role?.name === "ADMIN";
  const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null);
  const [form, setForm] = useState({
    employeeId: "",
    clientId: "",
    workLocationId: "",
    shiftId: "",
    startDate: "",
    endDate: "",
  });
  const [editForm, setEditForm] = useState({
    employeeId: "",
    clientId: "",
    workLocationId: "",
    shiftId: "",
    startDate: "",
    endDate: "",
    isActive: "true",
  });

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
      const payload = {
        employeeId: selectedEmployeeId,
        clientId: selectedClientId,
        workLocationId: selectedLocationId,
        shiftId: selectedShiftId,
        startDate: form.startDate,
        endDate: form.endDate || undefined,
      };

      const { data } = await api.post<Assignment>("/master-data/assignments", payload);
      return data;
    },
    onSuccess: () => {
      setForm({
        employeeId: "",
        clientId: "",
        workLocationId: "",
        shiftId: "",
        startDate: "",
        endDate: "",
      });
      queryClient.invalidateQueries({ queryKey: ["master-data", "assignments"] });
    },
  });

  const updateAssignmentMutation = useMutation({
    mutationFn: async () => {
      if (!editingAssignmentId) {
        throw new Error("No assignment selected");
      }

      const payload = {
        employeeId: editForm.employeeId,
        clientId: editForm.clientId,
        workLocationId: editForm.workLocationId,
        shiftId: editForm.shiftId,
        startDate: editForm.startDate,
        endDate: editForm.endDate || undefined,
        isActive: editForm.isActive === "true",
      };

      const { data } = await api.patch<Assignment>(
        `/master-data/assignments/${editingAssignmentId}`,
        payload,
      );
      return data;
    },
    onSuccess: () => {
      setEditingAssignmentId(null);
      queryClient.invalidateQueries({ queryKey: ["master-data", "assignments"] });
    },
  });

  const deleteAssignmentMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete<Assignment>(`/master-data/assignments/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["master-data", "assignments"] });
    },
  });

  const canSubmit =
    selectedEmployeeId &&
    selectedClientId &&
    selectedLocationId &&
    selectedShiftId &&
    form.startDate;

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => {
      if (field === "clientId") {
        return { ...current, clientId: value, workLocationId: "" };
      }

      return { ...current, [field]: value };
    });
  }

  function updateEditField(field: keyof typeof editForm, value: string) {
    setEditForm((current) => {
      if (field === "clientId") {
        const nextLocationId =
          locationsQuery.data?.find((location) => location.clientId === value)?.id || "";

        return {
          ...current,
          clientId: value,
          workLocationId: nextLocationId,
        };
      }

      return { ...current, [field]: value };
    });
  }

  function startEdit(assignment: Assignment) {
    setEditingAssignmentId(assignment.id);
    setEditForm({
      employeeId: assignment.employee.id,
      clientId: assignment.client.id,
      workLocationId: assignment.workLocation.id,
      shiftId: assignment.shift.id,
      startDate: formatDate(assignment.startDate),
      endDate: assignment.endDate ? formatDate(assignment.endDate) : "",
      isActive: String(assignment.isActive),
    });
  }

  function cancelEdit() {
    setEditingAssignmentId(null);
  }

  function deleteAssignment(assignment: Assignment) {
    const confirmed = window.confirm(
      `Hapus assignment ${assignment.employee.employeeNumber} - ${assignment.client.name}?`,
    );

    if (!confirmed) {
      return;
    }

    deleteAssignmentMutation.mutate(assignment.id);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createAssignmentMutation.mutate();
  }

  return (
    <AdminShell
      title="Assignments"
      description="Hubungkan karyawan dengan client, lokasi kerja, dan shift."
      user={user}
    >
      <div
        className={
          canManageMasterData ? "grid gap-4 xl:grid-cols-[420px_1fr]" : "grid gap-4"
        }
      >
        {canManageMasterData ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Tambah Assignment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="employeeId">Employee</Label>
                <Select
                  id="employeeId"
                  value={selectedEmployeeId}
                  onChange={(event) => updateField("employeeId", event.target.value)}
                  required
                >
                  {!employeesQuery.data?.length ? <option value="">Belum ada employee</option> : null}
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
                  {!clientsQuery.data?.length ? <option value="">Belum ada client</option> : null}
                  {clientsQuery.data?.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.code} - {client.name}
                    </option>
                  ))}
                </Select>
              </div>
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
              <div className="grid grid-cols-2 gap-3">
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
              </div>
              {createAssignmentMutation.isError ? (
                <p className="text-sm text-red-600">Gagal menambah assignment.</p>
              ) : null}
              <Button
                className="w-full"
                type="submit"
                disabled={!canSubmit || createAssignmentMutation.isPending}
              >
                {createAssignmentMutation.isPending
                  ? "Menyimpan..."
                  : "Simpan Assignment"}
              </Button>
            </form>
          </CardContent>
        </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4" />
              Daftar Assignment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1280px] border-collapse text-sm">
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
                  {assignmentsQuery.data?.map((assignment) => {
                    const isEditing =
                      canManageMasterData && editingAssignmentId === assignment.id;
                    const editLocations = (locationsQuery.data ?? []).filter(
                      (location) => location.clientId === editForm.clientId,
                    );

                    return (
                      <tr key={assignment.id} className="border-b border-neutral-100">
                        {canManageMasterData ? (
                        <td className="py-3 pr-4">
                          {isEditing ? (
                            <Select
                              value={editForm.employeeId}
                              onChange={(event) =>
                                updateEditField("employeeId", event.target.value)
                              }
                              className="min-w-56"
                            >
                              {employeesQuery.data?.map((employee) => (
                                <option key={employee.id} value={employee.id}>
                                  {employee.employeeNumber} - {employee.user.fullName}
                                </option>
                              ))}
                            </Select>
                          ) : (
                            `${assignment.employee.employeeNumber} - ${assignment.employee.user.fullName}`
                          )}
                        </td>
                        ) : null}
                        <td className="py-3 pr-4">
                          {isEditing ? (
                            <Select
                              value={editForm.clientId}
                              onChange={(event) =>
                                updateEditField("clientId", event.target.value)
                              }
                              className="min-w-52"
                            >
                              {clientsQuery.data?.map((client) => (
                                <option key={client.id} value={client.id}>
                                  {client.code} - {client.name}
                                </option>
                              ))}
                            </Select>
                          ) : (
                            assignment.client.name
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          {isEditing ? (
                            <Select
                              value={editForm.workLocationId}
                              onChange={(event) =>
                                updateEditField("workLocationId", event.target.value)
                              }
                              className="min-w-48"
                            >
                              {!editLocations.length ? (
                                <option value="">Belum ada lokasi</option>
                              ) : null}
                              {editLocations.map((location) => (
                                <option key={location.id} value={location.id}>
                                  {location.name}
                                </option>
                              ))}
                            </Select>
                          ) : (
                            assignment.workLocation.name
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          {isEditing ? (
                            <Select
                              value={editForm.shiftId}
                              onChange={(event) =>
                                updateEditField("shiftId", event.target.value)
                              }
                              className="min-w-44"
                            >
                              {shiftsQuery.data?.map((shift) => (
                                <option key={shift.id} value={shift.id}>
                                  {shift.code} - {shift.name}
                                </option>
                              ))}
                            </Select>
                          ) : (
                            assignment.shift.name
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          {isEditing ? (
                            <div className="grid w-64 grid-cols-2 gap-2">
                              <Input
                                type="date"
                                value={editForm.startDate}
                                onChange={(event) =>
                                  updateEditField("startDate", event.target.value)
                                }
                              />
                              <Input
                                type="date"
                                value={editForm.endDate}
                                onChange={(event) =>
                                  updateEditField("endDate", event.target.value)
                                }
                              />
                            </div>
                          ) : (
                            <>
                              {formatDate(assignment.startDate)} -{" "}
                              {assignment.endDate
                                ? formatDate(assignment.endDate)
                                : "Sekarang"}
                            </>
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
                              {assignment.isActive ? "Active" : "Inactive"}
                            </span>
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          {isEditing ? (
                            <div className="flex gap-2">
                              <Button
                                className="h-9 w-9 px-0"
                                onClick={() => updateAssignmentMutation.mutate()}
                                disabled={updateAssignmentMutation.isPending}
                                aria-label="Simpan perubahan"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                className="h-9 w-9 px-0"
                                variant="outline"
                                onClick={cancelEdit}
                                disabled={updateAssignmentMutation.isPending}
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
                                onClick={() => startEdit(assignment)}
                                aria-label="Edit assignment"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                className="h-9 w-9 px-0 text-red-600 hover:bg-red-50"
                                variant="outline"
                                onClick={() => deleteAssignment(assignment)}
                                disabled={deleteAssignmentMutation.isPending}
                                aria-label="Hapus assignment"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {!assignmentsQuery.isLoading && !assignmentsQuery.data?.length ? (
                    <tr>
                      <td className="py-6 text-neutral-500" colSpan={canManageMasterData ? 7 : 6}>
                        Belum ada assignment.
                      </td>
                    </tr>
                  ) : null}
                  {assignmentsQuery.isLoading ? (
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

function formatDate(value: string) {
  return value.slice(0, 10);
}

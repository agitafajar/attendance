"use client";

import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, MapPin, Pencil, Plus, Trash2, X } from "lucide-react";
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
};

type WorkLocation = {
  id: string;
  clientId: string;
  name: string;
  address?: string | null;
  latitude: string;
  longitude: string;
  geofenceRadiusMeter: number;
  isActive: boolean;
  client: Client;
};

export default function WorkLocationsPage() {
  const queryClient = useQueryClient();
  const { user, isReady } = useAuthGuard({ allowedRoles: MASTER_DATA_ROLES });
  const canManageMasterData = user?.role?.name === "ADMIN";
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null);
  const [form, setForm] = useState({
    clientId: "",
    name: "",
    address: "",
    latitude: "",
    longitude: "",
    geofenceRadiusMeter: "150",
  });
  const [editForm, setEditForm] = useState({
    clientId: "",
    name: "",
    address: "",
    latitude: "",
    longitude: "",
    geofenceRadiusMeter: "150",
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

  const locationsQuery = useQuery({
    queryKey: ["master-data", "work-locations"],
    queryFn: async () => {
      const { data } = await api.get<WorkLocation[]>("/master-data/work-locations");
      return data;
    },
    enabled: isReady,
  });

  const defaultClientId = clientsQuery.data?.[0]?.id ?? "";
  const selectedClientId = form.clientId || defaultClientId;

  const createLocationMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        clientId: selectedClientId,
        name: form.name,
        address: form.address || undefined,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        geofenceRadiusMeter: Number(form.geofenceRadiusMeter),
      };

      const { data } = await api.post<WorkLocation>("/master-data/work-locations", payload);
      return data;
    },
    onSuccess: () => {
      setForm({
        clientId: "",
        name: "",
        address: "",
        latitude: "",
        longitude: "",
        geofenceRadiusMeter: "150",
      });
      queryClient.invalidateQueries({ queryKey: ["master-data", "work-locations"] });
    },
  });

  const updateLocationMutation = useMutation({
    mutationFn: async () => {
      if (!editingLocationId) {
        throw new Error("No work location selected");
      }

      const payload = {
        clientId: editForm.clientId,
        name: editForm.name,
        address: editForm.address || undefined,
        latitude: Number(editForm.latitude),
        longitude: Number(editForm.longitude),
        geofenceRadiusMeter: Number(editForm.geofenceRadiusMeter),
        isActive: editForm.isActive === "true",
      };

      const { data } = await api.patch<WorkLocation>(
        `/master-data/work-locations/${editingLocationId}`,
        payload,
      );
      return data;
    },
    onSuccess: () => {
      setEditingLocationId(null);
      queryClient.invalidateQueries({ queryKey: ["master-data", "work-locations"] });
    },
  });

  const deleteLocationMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete<WorkLocation>(
        `/master-data/work-locations/${id}`,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["master-data", "work-locations"] });
    },
  });

  const canSubmit = useMemo(() => {
    return (
      Boolean(selectedClientId) &&
      Boolean(form.name) &&
      Number.isFinite(Number(form.latitude)) &&
      Number.isFinite(Number(form.longitude)) &&
      Number(form.geofenceRadiusMeter) > 0
    );
  }, [form.geofenceRadiusMeter, form.latitude, form.longitude, form.name, selectedClientId]);

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateEditField(field: keyof typeof editForm, value: string) {
    setEditForm((current) => ({ ...current, [field]: value }));
  }

  function startEdit(location: WorkLocation) {
    setEditingLocationId(location.id);
    setEditForm({
      clientId: location.clientId,
      name: location.name,
      address: location.address || "",
      latitude: String(location.latitude),
      longitude: String(location.longitude),
      geofenceRadiusMeter: String(location.geofenceRadiusMeter),
      isActive: String(location.isActive),
    });
  }

  function cancelEdit() {
    setEditingLocationId(null);
  }

  function deleteLocation(location: WorkLocation) {
    const confirmed = window.confirm(`Hapus lokasi ${location.name}?`);

    if (!confirmed) {
      return;
    }

    deleteLocationMutation.mutate(location.id);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createLocationMutation.mutate();
  }

  return (
    <AdminShell
      title="Work Locations"
      description="Kelola titik lokasi kerja dan radius geofence."
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
              Tambah Lokasi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="clientId">Client</Label>
                <Select
                  id="clientId"
                  value={selectedClientId}
                  onChange={(event) => updateField("clientId", event.target.value)}
                  disabled={!clientsQuery.data?.length}
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
              <div className="space-y-2">
                <Label htmlFor="name">Nama Lokasi</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  placeholder="Kantor Pusat"
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
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    inputMode="decimal"
                    value={form.latitude}
                    onChange={(event) => updateField("latitude", event.target.value)}
                    placeholder="-6.2087634"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    inputMode="decimal"
                    value={form.longitude}
                    onChange={(event) => updateField("longitude", event.target.value)}
                    placeholder="106.845599"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="geofenceRadiusMeter">Radius Geofence</Label>
                <Input
                  id="geofenceRadiusMeter"
                  inputMode="numeric"
                  value={form.geofenceRadiusMeter}
                  onChange={(event) =>
                    updateField("geofenceRadiusMeter", event.target.value)
                  }
                  required
                />
              </div>
              {createLocationMutation.isError ? (
                <p className="text-sm text-red-600">Gagal menambah lokasi.</p>
              ) : null}
              <Button
                className="w-full"
                type="submit"
                disabled={!canSubmit || createLocationMutation.isPending}
              >
                {createLocationMutation.isPending ? "Menyimpan..." : "Simpan Lokasi"}
              </Button>
            </form>
          </CardContent>
        </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Daftar Lokasi Kerja
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1120px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 text-left text-neutral-500">
                    <th className="py-3 pr-4 font-medium">Client</th>
                    <th className="py-3 pr-4 font-medium">Lokasi</th>
                    <th className="py-3 pr-4 font-medium">Koordinat</th>
                    <th className="py-3 pr-4 font-medium">Radius</th>
                    <th className="py-3 pr-4 font-medium">Status</th>
                    {canManageMasterData ? (
                      <th className="py-3 pr-4 font-medium">Aksi</th>
                    ) : null}
                  </tr>
                </thead>
                <tbody>
                  {locationsQuery.data?.map((location) => {
                    const isEditing = canManageMasterData && editingLocationId === location.id;

                    return (
                      <tr key={location.id} className="border-b border-neutral-100">
                        <td className="py-3 pr-4">
                          {isEditing ? (
                            <Select
                              value={editForm.clientId}
                              onChange={(event) =>
                                updateEditField("clientId", event.target.value)
                              }
                              className="min-w-56"
                            >
                              {clientsQuery.data?.map((client) => (
                                <option key={client.id} value={client.id}>
                                  {client.code} - {client.name}
                                </option>
                              ))}
                            </Select>
                          ) : (
                            `${location.client.code} - ${location.client.name}`
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
                            <>
                              <p className="font-medium">{location.name}</p>
                              <p className="mt-1 text-xs text-neutral-500">
                                {location.address || "-"}
                              </p>
                            </>
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          {isEditing ? (
                            <div className="grid w-64 grid-cols-2 gap-2">
                              <Input
                                value={editForm.latitude}
                                inputMode="decimal"
                                onChange={(event) =>
                                  updateEditField("latitude", event.target.value)
                                }
                              />
                              <Input
                                value={editForm.longitude}
                                inputMode="decimal"
                                onChange={(event) =>
                                  updateEditField("longitude", event.target.value)
                                }
                              />
                            </div>
                          ) : (
                            `${location.latitude}, ${location.longitude}`
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          {isEditing ? (
                            <Input
                              value={editForm.geofenceRadiusMeter}
                              inputMode="numeric"
                              onChange={(event) =>
                                updateEditField("geofenceRadiusMeter", event.target.value)
                              }
                              className="w-28"
                            />
                          ) : (
                            `${location.geofenceRadiusMeter} m`
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
                            <StatusBadge status={location.isActive} />
                          )}
                        </td>
                        {canManageMasterData ? (
                          <td className="py-3 pr-4">
                            {isEditing ? (
                              <div className="flex gap-2">
                                <Button
                                  className="h-9 w-9 px-0"
                                  onClick={() => updateLocationMutation.mutate()}
                                  disabled={updateLocationMutation.isPending}
                                  aria-label="Simpan perubahan"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  className="h-9 w-9 px-0"
                                  variant="outline"
                                  onClick={cancelEdit}
                                  disabled={updateLocationMutation.isPending}
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
                                  onClick={() => startEdit(location)}
                                  aria-label="Edit lokasi"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  className="h-9 w-9 px-0 text-red-600 hover:bg-red-50"
                                  variant="outline"
                                  onClick={() => deleteLocation(location)}
                                  disabled={deleteLocationMutation.isPending}
                                  aria-label="Hapus lokasi"
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
                  {!locationsQuery.isLoading && !locationsQuery.data?.length ? (
                    <tr>
                      <td className="py-6 text-neutral-500" colSpan={canManageMasterData ? 6 : 5}>
                        Belum ada lokasi kerja.
                      </td>
                    </tr>
                  ) : null}
                  {locationsQuery.isLoading ? (
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

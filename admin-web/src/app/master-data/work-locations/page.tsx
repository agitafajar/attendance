"use client";

import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, MapPin, Pencil, Plus, Trash2 } from "lucide-react";
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

type LocationForm = {
  clientId: string;
  name: string;
  address: string;
  latitude: string;
  longitude: string;
  geofenceRadiusMeter: string;
  isActive: string;
};

type ConfirmState =
  | { action: "delete"; location: WorkLocation }
  | null;

const emptyForm: LocationForm = {
  clientId: "",
  name: "",
  address: "",
  latitude: "",
  longitude: "",
  geofenceRadiusMeter: "150",
  isActive: "true",
};

export default function WorkLocationsPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { user, isReady } = useAuthGuard({ allowedRoles: MASTER_DATA_ROLES });
  const canManageMasterData = user?.role?.name === "ADMIN";
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [form, setForm] = useState<LocationForm>(emptyForm);
  const [confirmState, setConfirmState] = useState<ConfirmState>(null);

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
      const { data } = await api.post<WorkLocation>(
        "/master-data/work-locations",
        buildPayload(form, selectedClientId, false),
      );
      return data;
    },
    onSuccess: () => {
      closeModal();
      setConfirmState(null);
      queryClient.invalidateQueries({ queryKey: ["master-data", "work-locations"] });
      showToast({ title: "Lokasi berhasil ditambahkan", tone: "success" });
    },
    onError: () => {
      setConfirmState(null);
      showToast({ title: "Gagal menambah lokasi", tone: "error" });
    },
  });

  const updateLocationMutation = useMutation({
    mutationFn: async () => {
      if (!selectedLocationId) {
        throw new Error("No work location selected");
      }

      const { data } = await api.patch<WorkLocation>(
        `/master-data/work-locations/${selectedLocationId}`,
        buildPayload(form, selectedClientId, true),
      );
      return data;
    },
    onSuccess: () => {
      closeModal();
      setConfirmState(null);
      queryClient.invalidateQueries({ queryKey: ["master-data", "work-locations"] });
      showToast({ title: "Lokasi berhasil diperbarui", tone: "success" });
    },
    onError: () => {
      setConfirmState(null);
      showToast({ title: "Gagal memperbarui lokasi", tone: "error" });
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
      setConfirmState(null);
      queryClient.invalidateQueries({ queryKey: ["master-data", "work-locations"] });
      showToast({ title: "Lokasi berhasil dihapus", tone: "success" });
    },
    onError: () => {
      setConfirmState(null);
      showToast({ title: "Gagal menghapus lokasi", tone: "error" });
    },
  });

  const canSubmit = useMemo(() => {
    const latitude = Number(form.latitude);
    const longitude = Number(form.longitude);

    return (
      Boolean(selectedClientId) &&
      Boolean(form.name) &&
      Number.isFinite(latitude) &&
      latitude >= -90 &&
      latitude <= 90 &&
      Number.isFinite(longitude) &&
      longitude >= -180 &&
      longitude <= 180 &&
      Number(form.geofenceRadiusMeter) > 0
    );
  }, [form.geofenceRadiusMeter, form.latitude, form.longitude, form.name, selectedClientId]);

  const isMutating =
    createLocationMutation.isPending ||
    updateLocationMutation.isPending ||
    deleteLocationMutation.isPending;

  function updateField(field: keyof LocationForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function openCreateModal() {
    setSelectedLocationId(null);
    setForm({ ...emptyForm, clientId: defaultClientId });
    setModalMode("create");
  }

  function openEditModal(location: WorkLocation) {
    setSelectedLocationId(location.id);
    setForm({
      clientId: location.clientId,
      name: location.name,
      address: location.address || "",
      latitude: String(location.latitude),
      longitude: String(location.longitude),
      geofenceRadiusMeter: String(location.geofenceRadiusMeter),
      isActive: String(location.isActive),
    });
    setModalMode("edit");
  }

  function closeModal() {
    if (isMutating) return;
    setModalMode(null);
    setSelectedLocationId(null);
    setForm(emptyForm);
  }

  function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (modalMode === "edit") {
      updateLocationMutation.mutate();
      return;
    }

    createLocationMutation.mutate();
  }

  function confirmAction() {
    if (confirmState?.action === "delete") {
      deleteLocationMutation.mutate(confirmState.location.id);
    }
  }

  return (
    <AdminShell
      title="Work Locations"
      description="Kelola titik lokasi kerja dan radius geofence."
      user={user}
    >
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Daftar Lokasi Kerja
              </CardTitle>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                Lokasi kerja, koordinat, dan radius geofence per client.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-[var(--muted)]">
                {locationsQuery.data?.length ?? 0} lokasi
              </span>
              {canManageMasterData ? (
                <Button onClick={openCreateModal} disabled={!clientsQuery.data?.length}>
                  <Plus className="h-4 w-4" />
                  Lokasi
                </Button>
              ) : null}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse text-sm">
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
                {locationsQuery.data?.map((location) => (
                  <tr key={location.id} className="border-b border-neutral-100">
                    <td className="py-3 pr-4">
                      {location.client.code} - {location.client.name}
                    </td>
                    <td className="py-3 pr-4">
                      <p className="font-medium">{location.name}</p>
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        {location.address || "-"}
                      </p>
                    </td>
                    <td className="py-3 pr-4">
                      {location.latitude}, {location.longitude}
                    </td>
                    <td className="py-3 pr-4">{location.geofenceRadiusMeter} m</td>
                    <td className="py-3 pr-4">
                      <StatusBadge status={location.isActive} />
                    </td>
                    {canManageMasterData ? (
                      <td className="py-3 pr-4">
                        <div className="flex gap-2">
                          <Button
                            className="h-9 w-9 px-0"
                            variant="outline"
                            onClick={() => openEditModal(location)}
                            aria-label="Edit lokasi"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            className="h-9 w-9 border-red-200 px-0 text-red-700 hover:border-red-300 hover:bg-red-50"
                            variant="outline"
                            onClick={() => setConfirmState({ action: "delete", location })}
                            disabled={deleteLocationMutation.isPending}
                            aria-label="Hapus lokasi"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))}
                {!locationsQuery.isLoading && !locationsQuery.isError && !locationsQuery.data?.length ? (
                  <EmptyTableRow colSpan={canManageMasterData ? 6 : 5}>
                    Belum ada lokasi kerja.
                  </EmptyTableRow>
                ) : null}
                {locationsQuery.isLoading ? (
                  <LoadingTableRow colSpan={canManageMasterData ? 6 : 5} />
                ) : null}
                {locationsQuery.isError ? (
                  <ErrorTableRow
                    colSpan={canManageMasterData ? 6 : 5}
                    title="Lokasi kerja gagal dimuat"
                    description="Data lokasi kerja belum bisa ditampilkan. Coba muat ulang beberapa saat lagi."
                    onRetry={() => locationsQuery.refetch()}
                  />
                ) : null}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Modal
        open={Boolean(modalMode)}
        title={modalMode === "edit" ? "Edit Lokasi Kerja" : "Tambah Lokasi Kerja"}
        description="Lengkapi client, alamat, koordinat, dan radius geofence."
        size="xl"
        onClose={closeModal}
        footer={
          <>
            <Button variant="outline" onClick={closeModal} disabled={isMutating}>
              Batal
            </Button>
            <Button type="submit" form="location-form" disabled={!canSubmit || isMutating}>
              {isMutating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {modalMode === "edit" ? "Simpan Perubahan" : "Simpan Lokasi"}
            </Button>
          </>
        }
      >
        <form id="location-form" className="space-y-4" onSubmit={submitForm}>
          <div className="grid gap-4 sm:grid-cols-2">
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
          <div className="grid gap-4 sm:grid-cols-3">
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
            <div className="space-y-2">
              <Label htmlFor="geofenceRadiusMeter">Radius</Label>
              <Input
                id="geofenceRadiusMeter"
                inputMode="numeric"
                value={form.geofenceRadiusMeter}
                onChange={(event) => updateField("geofenceRadiusMeter", event.target.value)}
                required
              />
            </div>
          </div>
          {getCoordinateError(form) ? (
            <FormError>{getCoordinateError(form)}</FormError>
          ) : null}
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
          {createLocationMutation.isError && modalMode === "create" ? (
            <FormError>Gagal menambah lokasi.</FormError>
          ) : null}
          {updateLocationMutation.isError && modalMode === "edit" ? (
            <FormError>Gagal memperbarui lokasi.</FormError>
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
  form: LocationForm,
  selectedClientId: string,
  includeActive: boolean,
) {
  const payload: {
    clientId: string;
    name: string;
    address?: string;
    latitude: string;
    longitude: string;
    geofenceRadiusMeter: number;
    isActive?: boolean;
  } = {
    clientId: selectedClientId,
    name: form.name,
    address: form.address || undefined,
    latitude: form.latitude,
    longitude: form.longitude,
    geofenceRadiusMeter: Number(form.geofenceRadiusMeter),
  };

  if (includeActive) {
    payload.isActive = form.isActive === "true";
  }

  return payload;
}

function getCoordinateError(form: LocationForm) {
  if (!form.latitude && !form.longitude) return "";

  const latitude = Number(form.latitude);
  const longitude = Number(form.longitude);

  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    return "Latitude harus berada di rentang -90 sampai 90.";
  }

  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    return "Longitude harus berada di rentang -180 sampai 180.";
  }

  return "";
}

function getConfirmTitle(confirmState: ConfirmState) {
  return confirmState?.action === "delete" ? "Hapus lokasi?" : "";
}

function getConfirmDescription(confirmState: ConfirmState) {
  if (confirmState?.action === "delete") {
    return `Lokasi ${confirmState.location.name} akan dihapus dari master data.`;
  }

  return "";
}

function getConfirmText(confirmState: ConfirmState) {
  return confirmState?.action === "delete" ? "Hapus Lokasi" : "Konfirmasi";
}

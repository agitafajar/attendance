# Approval API

Base path: `/api/v1/approvals`

All endpoints require bearer token.

Roles: `ADMIN`, `SUPERVISOR`

Scope:

- Admin can approve and reject all records.
- Supervisor can approve and reject records for employees under the supervisor.

## Pending Attendances

`GET /attendances/pending`

Returns attendance records awaiting approval.

Included statuses:

- `PRESENT`
- `LATE`
- `PENDING_APPROVAL`

## Approve Attendance

`POST /attendances/:id/approve`

```json
{
  "notes": "Data absensi sudah sesuai."
}
```

Result:

- Attendance status becomes `APPROVED`.
- `approved_by` and `approved_at` are filled.
- Approval log is created.

## Reject Attendance

`POST /attendances/:id/reject`

```json
{
  "notes": "Lokasi check-in tidak sesuai area kerja."
}
```

Result:

- Attendance status becomes `REJECTED`.
- `rejection_note` is filled.
- Approval log is created.

## Pending Daily Activities

`GET /daily-activities/pending`

Returns daily activity records with status `SUBMITTED`.

## Approve Daily Activity

`POST /daily-activities/:id/approve`

```json
{
  "notes": "Kegiatan sudah sesuai."
}
```

Result:

- Activity status becomes `APPROVED`.
- `approved_by` and `approved_at` are filled.
- Approval log is created.

## Reject Daily Activity

`POST /daily-activities/:id/reject`

```json
{
  "notes": "Deskripsi kegiatan perlu dilengkapi."
}
```

Result:

- Activity status becomes `REJECTED`.
- `rejection_note` is filled.
- Approval log is created.

## Pending Leave Requests

`GET /leave-requests/pending`

Returns leave requests with status `SUBMITTED`.

## Approve Leave Request

`POST /leave-requests/:id/approve`

```json
{
  "notes": "Izin disetujui."
}
```

Result:

- Leave request status becomes `APPROVED`.
- `approved_by` and `approved_at` are filled.
- Approval log is created.

## Reject Leave Request

`POST /leave-requests/:id/reject`

```json
{
  "notes": "Kuota cuti tahunan tidak mencukupi."
}
```

Result:

- Leave request status becomes `REJECTED`.
- `rejection_note` is filled.
- Approval log is created.

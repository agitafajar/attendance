# Leave Request API

Base path: `/api/v1/leave-requests`

All endpoints require bearer token.

## Create Leave Request

`POST /`

Role: `EMPLOYEE`

```json
{
  "type": "SICK",
  "startDate": "2026-06-10",
  "endDate": "2026-06-12",
  "reason": "Sakit dan membutuhkan istirahat.",
  "attachmentUrl": "/uploads/leaves/surat-dokter.jpg"
}
```

Rules:

- Type: `SICK`, `LEAVE`, `ANNUAL`.
- `endDate` cannot be earlier than `startDate`.
- New request status is `SUBMITTED`.

## My Leave Requests

`GET /me`

Role: `EMPLOYEE`

Query filters:

- `startDate`
- `endDate`
- `type`
- `status`

## List Leave Requests

`GET /`

Roles: `ADMIN`, `SUPERVISOR`, `EMPLOYEE`

Query filters:

- `startDate`
- `endDate`
- `type`
- `status`
- `employeeId`

Scope:

- Admin can view all leave requests.
- Supervisor can view employees under the supervisor.
- Employee can view own leave requests only.

## Detail Leave Request

`GET /:id`

Roles: `ADMIN`, `SUPERVISOR`, `EMPLOYEE`

Uses the same role scope rules as list leave requests.

## Cancel Leave Request

`POST /:id/cancel`

Role: `EMPLOYEE`

Rules:

- Only owner can cancel.
- Only `SUBMITTED` leave requests can be cancelled.
- Cancellation uses soft delete.

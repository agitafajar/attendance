# Daily Activity API

Base path: `/api/v1/daily-activities`

All endpoints require bearer token.

## Create Activity

`POST /`

Role: `EMPLOYEE`

```json
{
  "attendanceId": "optional-attendance-uuid",
  "activityDate": "2026-06-02",
  "title": "Patroli area lobby",
  "description": "Melakukan patroli area lobby dan pengecekan akses tamu.",
  "latitude": -6.2087634,
  "longitude": 106.845599,
  "status": "DRAFT",
  "photoUrls": ["/uploads/activities/photo-1.jpg"]
}
```

Rules:

- Employee can create as `DRAFT` or `SUBMITTED`.
- If `attendanceId` is omitted, the system links attendance from the same date when found.
- Photo URLs are stored in `daily_activity_photos`.

## Update Activity

`PATCH /:id`

Role: `EMPLOYEE`

Only the owner can update, and only while status is `DRAFT`.

## Submit Activity

`POST /:id/submit`

Role: `EMPLOYEE`

Changes status from `DRAFT` to `SUBMITTED`.

## Delete Activity

`DELETE /:id`

Role: `EMPLOYEE`

Soft deletes draft activity and its photos.

## My Activities

`GET /me/today`

Role: `EMPLOYEE`

Returns today's activities.

`GET /me?date=2026-06-02`

Role: `EMPLOYEE`

Returns own activities by date.

## List Activities

`GET /`

Roles: `ADMIN`, `SUPERVISOR`, `EMPLOYEE`

Query filters:

- `startDate`
- `endDate`
- `status`
- `employeeId`
- `attendanceId`

Scope:

- Admin can view all activities.
- Supervisor can view employees under the supervisor.
- Employee can view own activities only.

## Detail Activity

`GET /:id`

Roles: `ADMIN`, `SUPERVISOR`, `EMPLOYEE`

Uses the same role scope rules as list activities.

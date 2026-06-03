# Attendance API

Base path: `/api/v1/attendances`

All endpoints require bearer token.

## Check In

`POST /check-in`

Role: `EMPLOYEE`

```json
{
  "assignmentId": "optional-uuid-when-multiple-active-assignments",
  "attendanceDate": "2026-06-02",
  "latitude": -6.2087634,
  "longitude": 106.845599,
  "photoUrl": "/uploads/attendance/check-in.jpg"
}
```

Rules:

- Employee must have an active assignment for the attendance date.
- GPS must be inside work location geofence radius.
- `lateMinutes` is calculated from shift start time plus grace period.
- Status becomes `PRESENT` or `LATE`.

## Check Out

`POST /check-out`

Role: `EMPLOYEE`

```json
{
  "attendanceDate": "2026-06-02",
  "latitude": -6.2087634,
  "longitude": 106.845599,
  "photoUrl": "/uploads/attendance/check-out.jpg"
}
```

Rules:

- Employee must already be checked in.
- GPS must be inside work location geofence radius.
- `workMinutes` is calculated from check-in to check-out time.

## My Attendance

`GET /me/today`

Role: `EMPLOYEE`

Returns today's attendance.

`GET /me?date=2026-06-02`

Role: `EMPLOYEE`

Returns employee attendance by date.

## List Attendance

`GET /`

Roles: `ADMIN`, `SUPERVISOR`, `EMPLOYEE`

Query filters:

- `startDate`
- `endDate`
- `status`
- `employeeId`
- `clientId`
- `workLocationId`

Scope:

- Admin can view all attendance records.
- Supervisor can view employees under the supervisor.
- Employee can view own records only.

## Detail Attendance

`GET /:id`

Roles: `ADMIN`, `SUPERVISOR`, `EMPLOYEE`

Uses the same role scope rules as list attendance.

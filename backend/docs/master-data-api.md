# Master Data API

Base path: `/api/v1/master-data`

All endpoints require bearer token.

Read roles: `ADMIN`, `SUPERVISOR`

Write roles: `ADMIN`

## Clients

```text
GET    /clients
POST   /clients
PATCH  /clients/:id
DELETE /clients/:id
```

Create payload:

```json
{
  "code": "CL-001",
  "name": "PT Contoh Klien",
  "address": "Jl. Sudirman No. 1, Jakarta",
  "contactName": "Budi Santoso",
  "contactPhone": "081100000004"
}
```

## Work Locations

```text
GET    /work-locations?clientId=uuid
POST   /work-locations
PATCH  /work-locations/:id
DELETE /work-locations/:id
```

Create payload:

```json
{
  "clientId": "client-uuid",
  "name": "Kantor Pusat Klien",
  "address": "Jl. Sudirman No. 1, Jakarta",
  "latitude": -6.2087634,
  "longitude": 106.845599,
  "geofenceRadiusMeter": 150
}
```

## Shifts

```text
GET    /shifts
POST   /shifts
PATCH  /shifts/:id
DELETE /shifts/:id
```

Create payload:

```json
{
  "code": "SHIFT-PAGI",
  "name": "Shift Pagi",
  "startTime": "08:00",
  "endTime": "17:00",
  "gracePeriodMinutes": 10
}
```

## Supervisors

```text
GET  /supervisors
POST /supervisors
```

Create payload:

```json
{
  "email": "supervisor2@alihdaya.test",
  "password": "UseAStrongPassword123!",
  "fullName": "Supervisor Dua",
  "phone": "081100000010",
  "supervisorNumber": "SPV-002"
}
```

## Employees

```text
GET    /employees
POST   /employees
PATCH  /employees/:id
DELETE /employees/:id
```

Create payload:

```json
{
  "email": "employee2@alihdaya.test",
  "password": "UseAStrongPassword123!",
  "fullName": "Karyawan Dua",
  "phone": "081100000011",
  "employeeNumber": "EMP-002",
  "supervisorId": "supervisor-uuid",
  "position": "Security Officer",
  "joinDate": "2026-01-01",
  "employmentStatus": "CONTRACT"
}
```

## Assignments

```text
GET    /assignments?employeeId=uuid
POST   /assignments
PATCH  /assignments/:id
DELETE /assignments/:id
```

Create payload:

```json
{
  "employeeId": "employee-uuid",
  "clientId": "client-uuid",
  "workLocationId": "work-location-uuid",
  "shiftId": "shift-uuid",
  "startDate": "2026-01-01",
  "endDate": "2026-12-31"
}
```

Delete endpoints use soft delete.

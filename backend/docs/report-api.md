# Report API

Base path: `/api/v1/reports`

All endpoints require bearer token.

Roles: `ADMIN`, `SUPERVISOR`

## Daily Attendance

`GET /daily-attendance`

Query filters:

- `startDate`
- `endDate`
- `employeeId`
- `clientId`
- `workLocationId`

Example:

```text
GET /api/v1/reports/daily-attendance?startDate=2026-06-01&endDate=2026-06-30
```

## Monthly Attendance

`GET /monthly-attendance`

Query filters:

- `month` in `YYYY-MM` format
- `employeeId`
- `clientId`
- `workLocationId`

Example:

```text
GET /api/v1/reports/monthly-attendance?month=2026-06
```

Returns monthly summary rows and attendance details.

## Activity Report

`GET /activities`

Query filters:

- `startDate`
- `endDate`
- `employeeId`
- `clientId`
- `workLocationId`

## Client Report

`GET /clients`

Query filters:

- `clientId`
- `workLocationId`
- `employeeId`

Returns clients with locations and assignments.

## Location Report

`GET /locations`

Query filters:

- `clientId`
- `workLocationId`
- `employeeId`

Returns locations with client and assignment data.

## Excel Export

`GET /export/excel`

Query:

- `type`: `daily-attendance`, `monthly-attendance`, `activity`, `client`, `location`
- same filters as each report
- `month` is required for `monthly-attendance`

Example:

```text
GET /api/v1/reports/export/excel?type=daily-attendance&startDate=2026-06-01&endDate=2026-06-30
```

Returns `.xlsx` attachment.

## PDF Export

`GET /export/pdf`

Query:

- `type`: `daily-attendance`, `monthly-attendance`, `activity`, `client`, `location`
- same filters as each report
- `month` is required for `monthly-attendance`

Example:

```text
GET /api/v1/reports/export/pdf?type=activity&startDate=2026-06-01&endDate=2026-06-30
```

Returns `.pdf` attachment.

PDF export prints the first 200 rows. Use Excel export for complete large datasets.

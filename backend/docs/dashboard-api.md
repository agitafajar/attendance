# Dashboard API

Base path: `/api/v1/dashboard`

All endpoints require bearer token.

## Admin Dashboard

`GET /admin`

Role: `ADMIN`

Returns:

- `totalEmployees`
- `presentToday`
- `late`
- `absent`
- `leave`
- `activityStatistics.totalToday`
- `activityStatistics.submitted`
- `activityStatistics.approved`
- `activityStatistics.rejected`

Absent definition:

- Active assigned employees who do not have attendance today and are not on approved leave today.

## Supervisor Dashboard

`GET /supervisor`

Role: `SUPERVISOR`

Returns:

- `totalEmployees`
- `pendingAttendance`
- `pendingActivities`
- `pendingLeaves`

Scope:

- Only employees under the authenticated supervisor.

## Employee Dashboard

`GET /employee`

Role: `EMPLOYEE`

Returns:

- `employee`
- `myAttendance`
- `myActivities`
- `myLeaveRequests`

Scope:

- Only data belonging to the authenticated employee.

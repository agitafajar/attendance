# Mobile API

Base path: `/api/v1/mobile`

All endpoints require bearer token.

## `GET /me`

Returns the authenticated user with role and attached employee or supervisor profile.

Use this after login or app resume to hydrate the local session.

## `GET /today`

Role: `EMPLOYEE`

Returns one bootstrap payload for the employee home screen:

- Jakarta business date
- employee profile
- today's attendance
- today's daily activities and photos
- active or pending leave requests
- active assignments for today

## `GET /assignments/active`

Role: `EMPLOYEE`

Returns active assignments for the current Jakarta date. Use this before check-in when the employee can have more than one active placement.

## `GET /attendances`

Role: `EMPLOYEE`

Returns the authenticated employee attendance history.

Query:

- `page`: default `1`
- `limit`: default `20`, maximum `100`
- `startDate`: `YYYY-MM-DD`
- `endDate`: `YYYY-MM-DD`
- `status`: attendance status

## `GET /activities`

Role: `EMPLOYEE`

Returns the authenticated employee daily activity history with photos.

Query:

- `page`: default `1`
- `limit`: default `20`, maximum `100`
- `startDate`: `YYYY-MM-DD`
- `endDate`: `YYYY-MM-DD`
- `status`: approval status

## `GET /leave-requests`

Role: `EMPLOYEE`

Returns the authenticated employee leave request history.

Query:

- `page`: default `1`
- `limit`: default `20`, maximum `100`
- `startDate`: `YYYY-MM-DD`
- `endDate`: `YYYY-MM-DD`
- `type`: leave type
- `status`: approval status

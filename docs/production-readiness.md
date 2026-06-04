# Production Readiness Checklist

Use this before offering the system to the first pilot client.

## Environment

- `DATABASE_URL` points to the production PostgreSQL instance.
- `JWT_SECRET` and `JWT_REFRESH_SECRET` are long random values.
- `CORS_ORIGIN` is not `*` in production.
- `APP_URL` matches the public API/upload URL.
- `SWAGGER_ENABLED=false`, or Swagger is protected with strong credentials.
- `RATE_LIMIT_TTL` and `RATE_LIMIT_LIMIT` are set for expected traffic.
- `INCLUDE_DEMO_DATA=false`.
- Seeded/demo passwords are rotated.

## Uploads

- For production, prefer `UPLOAD_STORAGE=cloudinary`.
- If using local upload storage, mount and back up `UPLOAD_DIR`.
- Confirm uploaded attendance/activity/leave files are reachable from admin web.
- Confirm `UPLOAD_MAX_SIZE_MB` matches field usage.

## Mobile

- Launcher icon and splash are generated.
- Android release keystore exists and `android/key.properties` is configured.
- API base URL is set and tested from the login screen.
- Real device UAT in `mobile-app/UAT.md` is complete.
- APK is tested with GPS, camera, upload, and poor network.

## Admin Web

- Admin-only master data access verified.
- Supervisor menu access verified.
- Employee data cannot be seen outside its scope.
- Empty, loading, and error states verified on all operational pages.
- Delete actions use confirm dialogs.

## Business Flow UAT

For local/demo UAT, seed with:

```bash
INCLUDE_DEMO_DATA=true DEMO_PASSWORD=LocalDemoPassword123! pnpm --dir backend prisma:seed
```

Demo accounts:

- `admin@alihdaya.test`
- `supervisor@alihdaya.test`
- `employee@alihdaya.test`

Demo flow data includes `PT Bank ABC`, `Cabang Medan`, `Shift Pagi`, and
employee `Budi Santoso`.

- Admin creates client.
- Admin creates work location with valid geofence.
- Admin creates shift.
- Admin creates employee and supervisor.
- Admin creates assignment.
- Employee checks in from mobile.
- Employee submits activity.
- Employee submits leave request.
- Supervisor approves/rejects activity and leave.
- Admin reviews attendance and reports.

## Operations

- PostgreSQL backup is scheduled and restore-tested.
- Upload backup is scheduled if using local uploads.
- Deploy workflow rebuilds and force recreates app containers.
- Nginx/HTTPS certificate renewal is verified.
- Container logs are monitored.
- A rollback plan exists for backend/admin/mobile releases.

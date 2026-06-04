# Alih Daya Attendance Mobile

Employee mobile app for GPS attendance, selfie proof, daily activities, leave
requests, offline pending sync, and attendance history.

## Runtime API

Default API base URL is compiled from:

```bash
--dart-define=API_BASE_URL=https://api.example.com/api/v1
```

The login screen also includes a Server API setting. This lets a client/VPS URL
be changed without rebuilding the APK. Users can enter either:

```text
https://api.example.com
```

or:

```text
https://api.example.com/api/v1
```

The app normalizes the URL to `/api/v1`.

## Employee Only

The mobile app is guarded for `EMPLOYEE` accounts only. Admin and supervisor
accounts should use the admin web dashboard.

## Local Checks

```bash
flutter analyze
flutter test
```

## Release

See [RELEASE.md](RELEASE.md) for Android signing and release build notes.

## Real Device UAT

Before giving an APK to a paying client, test on a real Android device.

See [UAT.md](UAT.md) for the full checklist.

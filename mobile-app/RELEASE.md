# Mobile Release Guide

Use this before building an APK/AAB for a pilot or production client.

## Preflight

- `flutter analyze` passes.
- `flutter test` passes.
- `mobile-app/UAT.md` has been completed on a real Android device.
- App version in `pubspec.yaml` is correct.
- Launcher icon and splash resources have been generated.
- Production API URL is known.
- Backend is reachable over HTTPS.
- Employee test account exists and has an active assignment.

## Android Signing

Release builds use `android/key.properties` when the file is present. The file
is ignored by git and must stay private.

Example:

```properties
storePassword=your-store-password
keyPassword=your-key-password
keyAlias=alih-daya
storeFile=../alih-daya-release.jks
```

Generate signing files:

```bash
chmod +x scripts/setup_android_signing.sh
scripts/setup_android_signing.sh
```

Confirm these private files exist:

```text
android/alih-daya-release.jks
android/key.properties
```

Without `android/key.properties`, release builds fall back to debug signing for
development only. Do not ship debug-signed release APKs to clients.

## Build Commands

APK:

```bash
flutter build apk --release \
  --dart-define=API_BASE_URL=https://api.example.com/api/v1
```

App Bundle:

```bash
flutter build appbundle --release \
  --dart-define=API_BASE_URL=https://api.example.com/api/v1
```

Expected outputs:

```text
build/app/outputs/flutter-apk/app-release.apk
build/app/outputs/bundle/release/app-release.aab
```

The app also supports changing the API URL from the login screen, but the
compiled default should still point to the intended production API.

## Post-build Checks

- Install APK on a real Android device.
- Confirm launcher icon and splash screen.
- Confirm app version shown on Login/Profile.
- Confirm Server API test succeeds.
- Login as employee.
- Check in with GPS and selfie.
- Submit activity and leave request.
- Logout and login again.

## Versioning

Before a client release, bump:

```yaml
version: 1.0.1+2
```

Use semantic app version for `1.0.1`, and increment Android build number after
the `+`.

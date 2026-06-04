# Mobile Real Device UAT

Run this checklist on a real Android device before giving the APK to a pilot
client.

## Preparation

- Backend API is deployed and reachable over HTTPS.
- Admin web can login as admin.
- Demo or pilot data exists:
  - one active client
  - one active work location with valid latitude/longitude/radius
  - one active shift
  - one employee account
  - one active assignment for today
- APK is installed on a real Android device.
- Device location services are enabled.

## Login And Server

- Open the app.
- Open Server API setting.
- Enter the production API domain.
- Tap `Tes` and confirm connection succeeds.
- Login with an `EMPLOYEE` account.
- Confirm `ADMIN` and `SUPERVISOR` accounts are rejected.
- Close and reopen the app.
- Confirm existing employee session opens Home without login.

## Permission Flow

- Deny camera permission once and confirm the app shows a clear message.
- Deny location permission once and confirm the app shows a clear message.
- Permanently block permission from Android settings.
- Confirm the app can open app settings or instruct the user clearly.
- Restore camera and location permission.

## Attendance

- Confirm Home shows today's assignment.
- Confirm the button is disabled when assignment is missing.
- Check in inside the geofence.
- Confirm selfie camera opens.
- Confirm upload succeeds.
- Confirm attendance status updates after refresh.
- Try check-in outside geofence and confirm backend rejects it.
- Check out after check-in.
- Confirm button becomes `Selesai Hari Ini` after checkout.
- Confirm attendance appears in Riwayat.

## Activity

- Open Aktivitas.
- Submit with title shorter than 3 characters.
- Confirm validation message appears.
- Submit with description shorter than 5 characters.
- Confirm validation message appears.
- Submit draft without photo.
- Submit activity with photo.
- Confirm activity appears in Riwayat.
- Confirm supervisor/admin can see submitted activity.

## Leave Request

- Open Izin.
- Submit with invalid/short reason.
- Confirm validation message appears.
- Set end date before start date.
- Confirm validation message appears.
- Submit valid sick leave.
- Submit valid annual leave.
- Confirm leave appears in Riwayat.
- Confirm supervisor/admin can see pending leave.

## Offline Pending

- Turn off internet.
- Submit activity.
- Confirm it is saved as pending.
- Submit leave request.
- Confirm it is saved as pending.
- Open Riwayat.
- Confirm pending card appears.
- Turn internet back on.
- Tap `Sinkron`.
- Confirm pending count decreases.
- Confirm synced records appear in backend/admin.

## Session

- Leave app open until access token expires, or reduce JWT expiry in staging.
- Trigger a data refresh.
- Confirm refresh token renews the session without forcing login.
- Logout manually.
- Confirm logout asks for confirmation.
- Confirm user returns to login.
- Confirm old refresh token is revoked by backend.

## Visual QA

- Check small Android screen width.
- Check long employee/client/location names.
- Check dark keyboard overlay on forms.
- Check text is not clipped in buttons.
- Check launcher icon and splash screen show correctly.

## Pass Criteria

- No crash during the checklist.
- No blank screen.
- No raw backend status codes shown to users.
- Attendance cannot be submitted without assignment.
- Check-in/out photos upload successfully.
- Offline pending sync works for activity and leave.
- Admin web reflects mobile submissions.

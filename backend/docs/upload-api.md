# Upload API

Base path: `/api/v1/uploads`

All endpoints require bearer token.

## Upload File

`POST /`

Query:

- `type`: `attendance`, `activity`, `leave`, `general`

Content type:

```text
multipart/form-data
```

Form field:

```text
file
```

Allowed file types:

- JPEG
- PNG
- WebP
- PDF

Default max size:

```text
5 MB
```

Change with:

```env
UPLOAD_MAX_SIZE_MB=5
```

## Storage Provider

By default uploads are saved to local disk under `UPLOAD_DIR`.

Set `UPLOAD_STORAGE=cloudinary` to save uploads to Cloudinary. In this mode the app fails during startup when any required Cloudinary env var is missing, so production does not silently fall back to local disk.

```env
UPLOAD_STORAGE=cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_FOLDER=alih-daya-attendance
```

Use the returned `url` in attendance, daily activity, and leave payloads.

Example local response:

```json
{
  "originalName": "photo.jpg",
  "filename": "uuid.jpg",
  "mimetype": "image/jpeg",
  "size": 123456,
  "path": "uploads/attendance/uuid.jpg",
  "url": "/uploads/attendance/uuid.jpg",
  "absoluteUrl": "http://localhost:3000/uploads/attendance/uuid.jpg",
  "storage": "local"
}
```

Example Cloudinary response:

```json
{
  "originalName": "photo.jpg",
  "filename": "alih-daya-attendance/attendance/cloudinary-public-id",
  "mimetype": "image/jpeg",
  "size": 123456,
  "path": "alih-daya-attendance/attendance/cloudinary-public-id",
  "url": "https://res.cloudinary.com/cloud-name/image/upload/...",
  "absoluteUrl": "https://res.cloudinary.com/cloud-name/image/upload/...",
  "storage": "cloudinary",
  "providerPublicId": "alih-daya-attendance/attendance/cloudinary-public-id"
}
```

Use `url` as:

- `checkInPhoto`
- `checkOutPhoto`
- daily activity `photoUrls`
- leave request `attachmentUrl`

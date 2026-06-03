# Security Hardening

Implemented:

- Helmet security headers.
- Global request validation with whitelist and unknown-field rejection.
- CORS controlled by `CORS_ORIGIN`.
- Trust proxy enabled for reverse proxy deployments.
- Global rate limiting with `@nestjs/throttler`.
- Required environment validation for database and JWT secrets.
- Upload file type validation.
- Upload file size limit.
- Static `/uploads` serving.

Environment:

```env
CORS_ORIGIN="*"
RATE_LIMIT_TTL=60
RATE_LIMIT_LIMIT=120
UPLOAD_MAX_SIZE_MB=5
```

Production recommendations:

- Set `CORS_ORIGIN` to the actual admin web and mobile gateway origins.
- Use long random JWT secrets.
- Keep Swagger behind auth or disable it in strict production if needed.
- Put HTTPS in front of Nginx.
- Add scheduled backups for PostgreSQL and upload volume.
- Rotate seeded dummy passwords immediately.

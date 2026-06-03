# Alih Daya Attendance

Backend system for outsourcing employee attendance, daily activities, leave requests, approvals, dashboard, and reports.

## Structure

```text
backend/                 NestJS API
backend/prisma/          Prisma schema, migrations, seed
backend/docs/            API and security notes
docs/                    Deployment guide
nginx/                   Container Nginx reverse proxy config
docker-compose.yml       PostgreSQL + backend + Nginx
.env.production.example  Production env template
```

## Local Backend

```bash
cd backend
cp .env.example .env
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run start:dev
```

`prisma:seed` creates roles only by default. For local demo records, run it with `INCLUDE_DEMO_DATA=true`.

Swagger:

```text
http://localhost:3000/api/docs
```

Set `SWAGGER_ENABLED=true` in `.env` to enable Swagger locally.

## Docker Deployment

```bash
cp .env.production.example .env
docker compose up -d --build
docker compose exec backend npm run prisma:deploy
docker compose exec backend npm run prisma:seed
```

Keep `INCLUDE_DEMO_DATA=false` and `SWAGGER_ENABLED=false` for public production.

Create the first production admin after migrations:

```bash
docker compose exec backend sh -lc 'ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD="StrongPassword123" ADMIN_FULL_NAME="Admin" npm run admin:create'
```

Full guide:

```text
docs/vps-deployment-guide.md
```

Useful backend docs:

```text
backend/docs/security-hardening.md
backend/docs/upload-api.md
```

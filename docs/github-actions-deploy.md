# GitHub Actions VPS Deploy

Workflow: `.github/workflows/deploy-vps.yml`

Push to `main` or `master` will deploy to the VPS with `rsync`, rebuild Docker services, run Prisma migrations, seed default roles, and restart containers.

## Required GitHub Secrets

Add these in GitHub repository settings:

- `VPS_HOST`: VPS IP or hostname
- `VPS_USER`: SSH user, for example `ubuntu`
- `VPS_SSH_KEY`: private SSH key that can log in to the VPS

Optional:

- `VPS_PORT`: SSH port, default `22`
- `VPS_PATH`: project path on VPS, default `/home/ubuntu/alih-daya-attendance`

## VPS Setup

Create an SSH key locally:

```bash
ssh-keygen -t ed25519 -C "github-actions-attendance" -f ~/.ssh/attendance_github_actions
```

Add the public key to the VPS:

```bash
ssh-copy-id -i ~/.ssh/attendance_github_actions.pub ubuntu@YOUR_VPS_IP
```

Put the private key content into GitHub secret `VPS_SSH_KEY`:

```bash
cat ~/.ssh/attendance_github_actions
```

Make sure the VPS project folder already has a production `.env` file. The workflow excludes `.env` files on purpose so secrets are not overwritten by repository files.

You can start from the repository template:

```bash
cd /home/ubuntu/alih-daya-attendance
cp .env.production.example .env
nano .env
```

At minimum, replace:

- `POSTGRES_PASSWORD`
- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `APP_URL`
- `CORS_ORIGIN`
- `MOBILE_API_BASE_URL`

Generate strong secrets with:

```bash
openssl rand -base64 48
```

## First Deploy

After adding the secrets, push to `main` or run the workflow manually from GitHub Actions.

Check the result on the VPS:

```bash
cd ~/alih-daya-attendance
docker compose ps
docker compose logs backend --tail=80
docker compose logs admin-web --tail=80
```

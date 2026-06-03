# Panduan Deployment VPS Ubuntu

Target VPS kamu:

```text
Host: ubuntu@43.134.71.209
OS: Ubuntu 24.04.3 LTS
User: ubuntu
```

Kondisi VPS saat ini sudah ada project lain:

```text
/home/ubuntu/booking-lapangan
/home/ubuntu/diggietech-web
/home/ubuntu/telegram-bots
```

Host Nginx juga sudah punya site lain:

```text
/etc/nginx/sites-available/booking-lapangan
/etc/nginx/sites-available/diggietatech
/etc/nginx/sites-available/finance-ai-backend
```

Karena itu, untuk project ini jangan langsung memakai container Nginx yang bind port `80`. Port `80` sudah sebaiknya tetap dikelola oleh host Nginx VPS. Strategy yang aman:

- Docker Compose menjalankan `postgres` dan `backend`.
- Backend diekspos ke host di port `3100`.
- Host Nginx membuat site baru `alih-daya-attendance`.
- Host Nginx reverse proxy ke `http://127.0.0.1:3100`.

## 1. Masuk VPS

```bash
ssh ubuntu@43.134.71.209
```

## 2. Cek Project dan Nginx Existing

Jangan hapus project lama.

```bash
cd /home/ubuntu
ls
```

Cek site Nginx existing:

```bash
ls /etc/nginx/sites-available
ls /etc/nginx/sites-enabled
```

Cek port yang sedang dipakai:

```bash
sudo ss -tulpn | grep LISTEN
```

Kalau port `3100` sudah dipakai, ganti `BACKEND_PORT` ke port lain, misalnya `3101`.

## 3. Install Docker Jika Belum Ada

Cek dulu:

```bash
docker --version
docker compose version
```

Kalau belum ada, install:

```bash
sudo apt update
sudo apt install -y ca-certificates curl git
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo tee /etc/apt/keyrings/docker.asc > /dev/null
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER
```

Setelah `usermod`, logout lalu login lagi:

```bash
exit
ssh ubuntu@43.134.71.209
```

## 4. Buat Folder Project Baru

Gunakan folder baru di `/home/ubuntu` agar tidak bercampur dengan project lain.

```bash
cd /home/ubuntu
mkdir -p alih-daya-attendance
cd alih-daya-attendance
```

Upload/copy isi project ke folder ini.

Struktur minimal setelah upload:

```text
/home/ubuntu/alih-daya-attendance
├── backend
├── docker-compose.yml
├── .env.production.example
├── nginx
└── docs
```

## 5. Buat File Environment

```bash
cd /home/ubuntu/alih-daya-attendance
cp .env.production.example .env
nano .env
```

Contoh konfigurasi aman untuk VPS yang sudah punya project lain:

```env
POSTGRES_DB=alih_daya_attendance
POSTGRES_USER=postgres
POSTGRES_PASSWORD=ganti_password_database_yang_kuat
DATABASE_URL=postgresql://postgres:ganti_password_database_yang_kuat@postgres:5432/alih_daya_attendance?schema=public

JWT_SECRET=ganti_dengan_random_panjang
JWT_REFRESH_SECRET=ganti_dengan_random_panjang_lain
JWT_EXPIRES_IN=1d
JWT_REFRESH_EXPIRES_IN=7d

APP_URL=http://43.134.71.209
UPLOAD_STORAGE=local
UPLOAD_DIR=/app/uploads
UPLOAD_MAX_SIZE_MB=5
PORT=3000

CORS_ORIGIN=*
RATE_LIMIT_TTL=60
RATE_LIMIT_LIMIT=120

BACKEND_PORT=3100
ADMIN_WEB_PORT=3101
ADMIN_WEB_API_BASE_URL=/api/backend
NGINX_HTTP_PORT=8088
```

Catatan:

- `PORT=3000` adalah port di dalam container backend.
- `BACKEND_PORT=3100` adalah port di host VPS.
- `NGINX_HTTP_PORT=8088` hanya dipakai kalau kamu tetap ingin menjalankan container Nginx. Untuk VPS kamu, lebih aman tidak menjalankan container Nginx.
- Kalau sudah punya domain/subdomain, ganti `APP_URL` dan `CORS_ORIGIN`.
- Untuk production dengan Cloudinary, pakai `UPLOAD_STORAGE=cloudinary` dan isi `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, serta `CLOUDINARY_FOLDER`.

Contoh dengan domain:

```env
APP_URL=https://attendance.domainkamu.com
CORS_ORIGIN=https://attendance.domainkamu.com
```

Untuk beberapa origin:

```env
CORS_ORIGIN=https://admin.domainkamu.com,https://attendance.domainkamu.com
```

## 6. Jalankan Backend dan PostgreSQL Saja

Karena host Nginx sudah berjalan untuk project lain, jalankan hanya service `postgres` dan `backend`.

```bash
docker compose up -d --build postgres backend
```

Cek status:

```bash
docker compose ps
docker compose logs -f backend
```

Pastikan backend listen di host port `3100`:

```bash
curl http://127.0.0.1:3100/api/docs
```

Kalau Swagger HTML muncul, backend sudah hidup.

## 7. Jalankan Migration dan Seed

```bash
docker compose exec backend npm run prisma:deploy
```

Seed hanya membuat role default secara aman. Data demo tidak dibuat kecuali `INCLUDE_DEMO_DATA=true`.

```bash
docker compose exec backend npm run prisma:seed
```

Untuk development lokal saja, data demo bisa dibuat dengan env berikut sebelum menjalankan seed:

```bash
INCLUDE_DEMO_DATA=true DEMO_PASSWORD='ganti-password-demo-kuat' npm run prisma:seed
```

Jangan aktifkan data demo di production.

### Buat Admin Production Pertama

Setelah migration dan seed roles-only, buat akun admin production:

```bash
docker compose exec backend sh -lc 'ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD="StrongPassword123" ADMIN_FULL_NAME="Admin" npm run admin:create'
```

Jika admin sudah ada dan password perlu dirotasi:

```bash
docker compose exec backend sh -lc 'ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD="StrongPasswordBaru123" ADMIN_FULL_NAME="Admin" ADMIN_UPDATE_PASSWORD=true npm run admin:create'
```

## 8. Buat Site Baru di Host Nginx

Buat file baru. Jangan edit/hapus site project lain.

```bash
sudo nano /etc/nginx/sites-available/alih-daya-attendance
```

Jika kamu belum punya domain dan ingin test via IP:

```nginx
server {
    listen 80;
    server_name 43.134.71.209;

    client_max_body_size 20m;

    location /uploads/ {
        proxy_pass http://127.0.0.1:3100/uploads/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3100/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    location / {
        return 200 "Alih Daya Attendance API is running\n";
        add_header Content-Type text/plain;
    }
}
```

Kalau sudah punya domain/subdomain, lebih bagus pakai:

```nginx
server {
    listen 80;
    server_name attendance.domainkamu.com;

    client_max_body_size 20m;

    location /uploads/ {
        proxy_pass http://127.0.0.1:3100/uploads/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3100/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    location / {
        return 200 "Alih Daya Attendance API is running\n";
        add_header Content-Type text/plain;
    }
}
```

Aktifkan site:

```bash
sudo ln -s /etc/nginx/sites-available/alih-daya-attendance /etc/nginx/sites-enabled/alih-daya-attendance
```

Cek konfigurasi Nginx:

```bash
sudo nginx -t
```

Reload Nginx:

```bash
sudo systemctl reload nginx
```

## 9. Akses API

Jika pakai IP:

```text
http://43.134.71.209/api/docs
```

Jika pakai domain:

```text
http://attendance.domainkamu.com/api/docs
```

Test dari VPS:

```bash
curl http://127.0.0.1:3100/api/docs
```

Test dari luar:

```bash
curl http://43.134.71.209/api/docs
```

## 10. HTTPS dengan Certbot

Jika sudah punya domain/subdomain:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d attendance.domainkamu.com
```

Setelah HTTPS aktif, update `.env`:

```env
APP_URL=https://attendance.domainkamu.com
CORS_ORIGIN=https://attendance.domainkamu.com
```

Restart backend:

```bash
docker compose restart backend
```

## 11. Command Harian

Lihat container:

```bash
docker compose ps
```

Lihat log backend:

```bash
docker compose logs -f backend
```

Restart backend:

```bash
docker compose restart backend
```

Rebuild setelah update kode:

```bash
docker compose up -d --build backend
```

Stop project ini saja:

```bash
docker compose stop backend postgres
```

Jangan pakai `docker system prune` sembarangan karena VPS punya project lain.

## 12. Backup Database

Backup:

```bash
cd /home/ubuntu/alih-daya-attendance
docker compose exec postgres pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > backup-alih-daya.sql
```

Restore:

```bash
cat backup-alih-daya.sql | docker compose exec -T postgres psql -U "$POSTGRES_USER" "$POSTGRES_DB"
```

## 13. Firewall

Minimal buka:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
sudo ufw status
```

Port `3100` tidak perlu dibuka ke publik kalau aksesnya lewat Nginx host. Kalau perlu test sementara dari luar, baru buka:

```bash
sudo ufw allow 3100
```

Setelah selesai test, tutup lagi:

```bash
sudo ufw delete allow 3100
```

## 14. Checklist Production

- Jangan hapus folder project lama.
- Jangan overwrite site Nginx lama.
- Gunakan site baru: `alih-daya-attendance`.
- Gunakan host port backend yang tidak bentrok, default `3100`.
- Untuk API saja, jalankan `postgres` dan `backend`.
- Untuk target `admin.financialku.online`, jalankan juga `admin-web`.
- Host Nginx reverse proxy ke `127.0.0.1:3100`.
- Ganti semua secret dan password.
- Ganti password user dummy.
- Aktifkan HTTPS jika sudah ada domain.
- Siapkan backup database berkala.
- Pantau disk usage untuk database dan uploads.

## 15. Khusus Target `https://api.financialku.online`

Dari konfigurasi VPS yang terlihat, domain ini sekarang dipakai oleh site:

```text
/etc/nginx/sites-available/finance-ai-backend
```

Dan saat ini proxy ke:

```text
http://127.0.0.1:3002
```

Kalau project Absensi ini harus berjalan di:

```text
https://api.financialku.online
```

maka domain tersebut akan menggantikan service lama yang saat ini ada di `finance-ai-backend`.

Langkah aman:

### 15.1 Backup Config Nginx Lama

```bash
sudo cp /etc/nginx/sites-available/finance-ai-backend \
  /etc/nginx/sites-available/finance-ai-backend.backup.$(date +%Y%m%d%H%M%S)
```

### 15.2 Pastikan Env Project Mengarah ke Domain

Di VPS:

```bash
cd /home/ubuntu/alih-daya-attendance
nano .env
```

Pastikan:

```env
APP_URL=https://api.financialku.online
CORS_ORIGIN=https://api.financialku.online,https://admin.financialku.online,http://localhost:3003,http://127.0.0.1:3003
BACKEND_PORT=3100
ADMIN_WEB_PORT=3101
ADMIN_WEB_API_BASE_URL=/api/backend
PORT=3000
```

### 15.3 Jalankan Backend Absensi

```bash
cd /home/ubuntu/alih-daya-attendance
docker compose up -d --build postgres backend
docker compose exec backend npm run prisma:deploy
docker compose exec backend npm run prisma:seed
```

Test internal:

```bash
curl -I http://127.0.0.1:3100/api/docs
```

Harus return `200` atau redirect/HTML Swagger.

### 15.4 Edit Nginx `finance-ai-backend`

Buka:

```bash
sudo nano /etc/nginx/sites-available/finance-ai-backend
```

Atau copy config siap pakai dari project:

```bash
sudo cp /home/ubuntu/alih-daya-attendance/deployment/nginx/api.financialku.online.conf \
  /etc/nginx/sites-available/finance-ai-backend
```

Ganti bagian HTTPS `location /` dari:

```nginx
proxy_pass http://127.0.0.1:3002;
```

menjadi:

```nginx
proxy_pass http://127.0.0.1:3100;
```

Rekomendasi config final untuk server HTTPS:

```nginx
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.financialku.online;

    client_max_body_size 20m;

    ssl_certificate /etc/letsencrypt/live/api.financialku.online/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.financialku.online/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Real-IP $remote_addr;

    proxy_read_timeout 180;
    proxy_connect_timeout 180;
    proxy_send_timeout 180;

    location /uploads/ {
        proxy_pass http://127.0.0.1:3100/uploads/;
        proxy_http_version 1.1;
    }

    location / {
        proxy_pass http://127.0.0.1:3100;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_cache_bypass $http_upgrade;
    }
}
```

HTTP to HTTPS block tetap:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name api.financialku.online;
    return 301 https://$host$request_uri;
}
```

### 15.5 Test dan Reload Nginx

```bash
sudo nginx -t
sudo systemctl reload nginx
```

Test dari VPS:

```bash
curl -I http://127.0.0.1:3100/api/docs
```

Test dari publik:

```bash
curl -I https://api.financialku.online/api/docs
```

Kalau berhasil, Swagger tersedia di:

```text
https://api.financialku.online/api/docs
```

### 15.6 Catatan Penting

Kalau service lama di `127.0.0.1:3002` masih dibutuhkan, jangan arahkan `api.financialku.online` ke project ini. Buat subdomain API baru, misalnya:

```text
attendance-api.domainkamu.com
```

## 16. Khusus Target `https://admin.financialku.online`

Admin Web Next.js dijalankan sebagai container terpisah dan diekspos ke host VPS di port:

```text
127.0.0.1:3101
```

Nginx host akan reverse proxy domain:

```text
https://admin.financialku.online
```

ke:

```text
http://127.0.0.1:3101
```

### 16.1 Pastikan DNS Subdomain

Di DNS provider, buat A record:

```text
admin.financialku.online -> 43.134.71.209
```

Tunggu propagasi, lalu cek:

```bash
dig +short admin.financialku.online
```

Harus mengarah ke:

```text
43.134.71.209
```

### 16.2 Update `.env`

Di VPS:

```bash
cd /home/ubuntu/alih-daya-attendance
nano .env
```

Pastikan ada:

```env
APP_URL=https://api.financialku.online
CORS_ORIGIN=https://api.financialku.online,https://admin.financialku.online,http://localhost:3003,http://127.0.0.1:3003
BACKEND_PORT=3100
ADMIN_WEB_PORT=3101
ADMIN_WEB_API_BASE_URL=/api/backend
PORT=3000
```

Catatan:

- `ADMIN_WEB_API_BASE_URL=/api/backend` membuat browser memanggil API lewat domain admin sendiri.
- Nginx `admin.financialku.online` akan meneruskan `/api/backend/*` ke `https://api.financialku.online/api/v1/*`.
- Ini mengurangi risiko CORS di browser.

### 16.3 Rebuild Backend dan Admin Web

Karena kita baru menambah endpoint supervisor di backend dan Dockerfile admin web, rebuild dua service ini:

```bash
cd /home/ubuntu/alih-daya-attendance
docker compose up -d --build backend admin-web
```

Kalau database belum jalan:

```bash
docker compose up -d postgres
docker compose up -d --build backend admin-web
```

Cek container:

```bash
docker compose ps
```

Harus ada:

```text
alih-daya-backend
alih-daya-admin-web
alih-daya-postgres
```

Test dari VPS:

```bash
curl -I http://127.0.0.1:3101
curl -I http://127.0.0.1:3101/login
curl -I http://127.0.0.1:3100/api/docs
```

### 16.4 Pasang Config Nginx Admin

Copy config siap pakai:

```bash
sudo cp /home/ubuntu/alih-daya-attendance/deployment/nginx/admin.financialku.online.conf \
  /etc/nginx/sites-available/admin-financialku-online
```

Aktifkan:

```bash
sudo ln -sf /etc/nginx/sites-available/admin-financialku-online \
  /etc/nginx/sites-enabled/admin-financialku-online
```

### 16.5 SSL Certbot

Kalau sertifikat belum ada:

```bash
sudo certbot --nginx -d admin.financialku.online
```

Kalau Certbot berhasil, dia akan menyesuaikan file Nginx. Setelah itu cek:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 16.6 Test Public Admin Web

Test dari VPS atau laptop:

```bash
curl -I https://admin.financialku.online
curl -I https://admin.financialku.online/login
```

Buka browser:

```text
https://admin.financialku.online/login
```

Login menggunakan akun admin production yang dibuat manual. Jangan pakai akun demo di server public.

### 16.7 Test Proxy API dari Admin Domain

Setelah login page tampil, test proxy API:

```bash
curl -I https://admin.financialku.online/api/backend/auth/login
```

Untuk login endpoint, `GET/HEAD` bisa memberi status selain `200` karena endpoint login adalah `POST`. Yang penting bukan error Nginx seperti `502`.

Test POST dengan kredensial production:

```bash
curl -X POST https://admin.financialku.online/api/backend/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin-production@example.com","password":"password-production-kuat"}'
```

Kalau keluar JSON token, FE dan API proxy sudah terhubung.

### 16.8 Command Update Setelah Upload Kode Baru

Setelah copy project terbaru ke VPS:

```bash
cd /home/ubuntu/alih-daya-attendance
docker compose up -d --build backend admin-web
sudo nginx -t
sudo systemctl reload nginx
```

Kalau hanya update Admin Web:

```bash
docker compose up -d --build admin-web
```

Kalau hanya update Backend:

```bash
docker compose up -d --build backend
```

```text
attendance.financialku.online
```

Lalu buat site Nginx baru khusus subdomain tersebut.

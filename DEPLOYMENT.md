# Yalla Deployment Guide

Production deployment guide for Yalla: Managed Experience Discovery Platform.

---

## 1. System Requirements

- **Node.js**: 20.x LTS
- **npm**: 9.x+
- **PostgreSQL**: 15.x
- **Redis**: 7.x (Optional / Recommended for rate-limiting and cache)
- **Reverse Proxy**: Nginx or Cloudflare (SSL termination & static file serving)

---

## 2. Environment Variables

### Frontend (`.env`)

```bash
VITE_API_URL=https://api.yalla.example.com/api/v1
```

`VITE_API_URL` is the only frontend variable the app reads; it defaults to
`http://localhost:3000/api/v1` when unset. Set it to the public API origin
including the `/api/v1` prefix.

### Backend (`backend/.env`)

```bash
NODE_ENV=production
PORT=3000
API_VERSION=v1
CORS_ORIGIN=https://yalla.example.com

# Database
DATABASE_URL=postgresql://yalla_user:secure_password@localhost:5432/yalla_prod
DB_HOST=localhost
DB_PORT=5432
DB_NAME=yalla_prod
DB_USER=yalla_user
DB_PASSWORD=secure_password

# Authentication (Must be cryptographically random 64-char strings)
JWT_SECRET=<generated-secret>
JWT_REFRESH_SECRET=<generated-secret>
SESSION_SECRET=<generated-secret>

# External Services
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## 3. Database Migration & Initialization

In the `backend/` directory:

```bash
# Execute schema migrations
npm run migrate

# Optional: Seed administrative accounts
npm run seed
```

---

## 4. Production Build & Deployment

### Option A: Standard Node Process (PM2 / Systemd)

```bash
# 1. Build Frontend
npm ci
npm run build
# Deploy 'dist/' directory to your static web server (e.g., Nginx)

# 2. Build and Start Backend
cd backend
npm ci
npm run build
pm2 start dist/server.js --name yalla-api -i max
```

### Option B: Docker Compose

```bash
# Start all services (PostgreSQL, Redis, Backend, Frontend, Adminer)
docker compose up -d --build

# Run migrations inside the backend container
docker compose exec backend npm run migrate
```

---

## 5. Nginx Reverse Proxy Configuration

```nginx
# Frontend Static Files
server {
    listen 80;
    server_name yalla.example.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yalla.example.com;

    ssl_certificate /etc/letsencrypt/live/yalla.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yalla.example.com/privkey.pem;

    root /var/www/yalla/dist;
    index index.html;

    # SPA routing fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health endpoint
    location /health {
        proxy_pass http://127.0.0.1:3000/health;
    }
}
```

---

## 6. Post-Deployment Verification

```bash
# 1. Verify healthcheck returns 200
curl -f https://yalla.example.com/health

# 2. Run automated Stage 6 maintenance check
node scripts/monitor-breach.js --dry-run
```

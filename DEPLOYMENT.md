# 🚀 Yalla MVP - Deployment Guide

**Version**: 1.0.0  
**Last Updated**: January 2026  
**Status**: ✅ Production Ready

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Database Setup](#database-setup)
4. [Backend Deployment](#backend-deployment)
5. [Frontend Deployment](#frontend-deployment)
6. [Docker Deployment](#docker-deployment)
7. [Production Checklist](#production-checklist)
8. [Monitoring & Logging](#monitoring--logging)
9. [Backup & Recovery](#backup--recovery)
10. [Troubleshooting](#troubleshooting)

---

## 🔧 Prerequisites

### Required Software
- **Node.js**: 18.x or higher
- **npm**: 9.x or higher
- **PostgreSQL**: 14.x or higher
- **Git**: 2.x or higher

### Optional Software
- **Docker**: 20.x or higher (for containerized deployment)
- **Docker Compose**: 2.x or higher
- **Redis**: 7.x or higher (for caching)

### Required Accounts
- **Stripe**: For payment processing
- **SendGrid/AWS SES**: For email notifications (optional)
- **Twilio/AWS SNS**: For SMS notifications (optional)
- **Firebase**: For push notifications (optional)
- **Sentry**: For error tracking (optional)

---

## 💻 Local Development Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd yalla-mvp
```

### 2. Install Dependencies

```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
```

### 3. Configure Environment Variables

```bash
# Backend
cd backend
cp .env.example .env
nano .env  # Edit with your configuration
```

**Required Environment Variables**:
```bash
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/yalla
DB_HOST=localhost
DB_PORT=5432
DB_NAME=yalla
DB_USER=postgres
DB_PASSWORD=password

# JWT (Generate secure random strings)
JWT_SECRET=<generate-secure-random-string>
JWT_REFRESH_SECRET=<generate-secure-random-string>

# Stripe (Use test keys for development)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Optional Services
SENDGRID_API_KEY=SG...
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
```

### 4. Setup Database

```bash
# Create database
createdb yalla

# Run migrations
cd backend
npm run migrate

# Seed demo data (optional)
npm run seed
```

### 5. Start Development Servers

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

### 6. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Health Check**: http://localhost:3000/health

### 7. Demo Credentials

After running `npm run seed`:

```
Participant:    +966501234567 / password123
Operations:     +966503456789 / password123
Support:        +966504567890 / password123
Trust & Safety: +966505678901 / password123
Admin:          +966506789012 / password123
```

---

## 🗄️ Database Setup

### PostgreSQL Installation

#### macOS
```bash
brew install postgresql@15
brew services start postgresql@15
```

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install postgresql-15
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### Windows
Download from: https://www.postgresql.org/download/windows/

### Create Database and User

```bash
# Login as postgres user
sudo -u postgres psql

# Create database
CREATE DATABASE yalla;

# Create user (optional)
CREATE USER yalla_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE yalla TO yalla_user;

# Exit
\q
```

### Run Migrations

```bash
cd backend
npm run migrate
```

### Seed Demo Data

```bash
cd backend
npm run seed
```

### Rollback Database (WARNING: Deletes all data)

```bash
cd backend
npm run migrate:rollback -- --confirm
```

---

## 🖥️ Backend Deployment

### Option 1: Direct Deployment (PM2)

#### 1. Install PM2

```bash
npm install -g pm2
```

#### 2. Build the Application

```bash
cd backend
npm run build
```

#### 3. Start with PM2

```bash
pm2 start dist/server.js --name yalla-backend
pm2 save
pm2 startup
```

#### 4. PM2 Commands

```bash
# View status
pm2 status

# View logs
pm2 logs yalla-backend

# Restart
pm2 restart yalla-backend

# Stop
pm2 stop yalla-backend

# Delete
pm2 delete yalla-backend
```

### Option 2: Systemd Service

#### 1. Create Service File

```bash
sudo nano /etc/systemd/system/yalla-backend.service
```

#### 2. Add Service Configuration

```ini
[Unit]
Description=Yalla Backend API
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/yalla/backend
ExecStart=/usr/bin/node dist/server.js
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production
Environment=DATABASE_URL=postgresql://user:password@localhost:5432/yalla

[Install]
WantedBy=multi-user.target
```

#### 3. Enable and Start Service

```bash
sudo systemctl daemon-reload
sudo systemctl enable yalla-backend
sudo systemctl start yalla-backend
sudo systemctl status yalla-backend
```

---

## 🌐 Frontend Deployment

### Option 1: Vercel (Recommended)

#### 1. Install Vercel CLI

```bash
npm install -g vercel
```

#### 2. Deploy

```bash
cd frontend
vercel
```

#### 3. Configure Environment Variables

In Vercel dashboard, add:
```
VITE_API_URL=https://api.yourdomain.com
```

### Option 2: Netlify

#### 1. Install Netlify CLI

```bash
npm install -g netlify-cli
```

#### 2. Deploy

```bash
cd frontend
npm run build
netlify deploy --prod --dir=dist
```

### Option 3: Manual Deployment (Nginx)

#### 1. Build Frontend

```bash
cd frontend
npm run build
```

#### 2. Copy to Server

```bash
scp -r dist/* user@server:/var/www/yalla/frontend/
```

#### 3. Configure Nginx

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    root /var/www/yalla/frontend;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API proxy
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🐳 Docker Deployment

### 1. Build Images

```bash
# Backend
cd backend
docker build -t yalla-backend:latest .

# Frontend
cd frontend
docker build -t yalla-frontend:latest .
```

### 2. Run with Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild and restart
docker-compose up -d --build
```

### 3. Access Services

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3000
- **Database**: localhost:5432
- **Adminer**: http://localhost:8080

### 4. Production Docker Compose

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: always

  backend:
    image: yalla-backend:latest
    environment:
      NODE_ENV: production
      DATABASE_URL: ${DATABASE_URL}
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      STRIPE_SECRET_KEY: ${STRIPE_SECRET_KEY}
    ports:
      - "3000:3000"
    depends_on:
      - postgres
    restart: always

  frontend:
    image: yalla-frontend:latest
    environment:
      VITE_API_URL: ${VITE_API_URL}
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: always

volumes:
  postgres_data:
```

---

## ✅ Production Checklist

### Pre-Deployment

- [ ] All tests passing (`npm test`)
- [ ] Build successful (`npm run build`)
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] SSL certificates obtained
- [ ] Domain configured
- [ ] DNS records updated

### Security

- [ ] Strong JWT secrets generated
- [ ] Database password secured
- [ ] API keys stored in environment variables
- [ ] CORS configured for production domain
- [ ] Rate limiting enabled
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] Input validation enabled
- [ ] SQL injection protection active
- [ ] XSS protection enabled

### Performance

- [ ] Database indexes created
- [ ] Query optimization completed
- [ ] Caching configured (Redis)
- [ ] CDN configured for static assets
- [ ] Gzip compression enabled
- [ ] Load balancing configured
- [ ] Auto-scaling configured

### Monitoring

- [ ] Error tracking configured (Sentry)
- [ ] Logging configured
- [ ] Health checks enabled
- [ ] Uptime monitoring configured
- [ ] Alert rules configured
- [ ] Performance monitoring enabled

### Backup & Recovery

- [ ] Database backup schedule configured
- [ ] Backup retention policy defined
- [ ] Recovery procedure documented
- [ ] Disaster recovery plan created
- [ ] Backup testing completed

---

## 📊 Monitoring & Logging

### Error Tracking (Sentry)

#### 1. Install Sentry

```bash
cd backend
npm install @sentry/node @sentry/tracing
```

#### 2. Configure Sentry

```typescript
// backend/src/server.ts
import * as Sentry from '@sentry/node';
import * as Tracing from '@sentry/tracing';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Tracing.Integrations.Express({ app }),
  ],
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
});
```

### Logging

#### 1. Configure Winston

Already configured in `backend/src/utils/logger.ts`

#### 2. Log Aggregation

Use services like:
- **Datadog**
- **Loggly**
- **Papertrail**
- **Graylog**

### Health Checks

```bash
# Backend health
curl http://localhost:3000/health

# Database health
psql -h localhost -U postgres -d yalla -c "SELECT 1"

# Redis health (if using)
redis-cli ping
```

---

## 💾 Backup & Recovery

### Database Backup

#### 1. Manual Backup

```bash
# Backup database
pg_dump -U postgres yalla > backup_$(date +%Y%m%d_%H%M%S).sql

# Compress backup
gzip backup_*.sql
```

#### 2. Automated Backup (Cron)

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * pg_dump -U postgres yalla | gzip > /backups/yalla_$(date +\%Y\%m\%d).sql.gz
```

### Database Restore

```bash
# Decompress backup
gunzip backup_20260120_120000.sql.gz

# Restore database
psql -U postgres yalla < backup_20260120_120000.sql
```

### File Backup

```bash
# Backup uploads
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz /var/www/yalla/uploads/

# Backup configuration
tar -czf config_backup_$(date +%Y%m%d).tar.gz /var/www/yalla/backend/.env
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Database Connection Error

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check connection
psql -U postgres -d yalla -c "SELECT 1"

# Check environment variables
echo $DATABASE_URL
```

#### 2. Port Already in Use

```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>

# Or change port in .env
PORT=3001
```

#### 3. Migration Errors

```bash
# Reset database
npm run migrate:rollback -- --confirm
npm run migrate

# Check migration status
psql -U postgres -d yalla -c "\dt"
```

#### 4. Build Errors

```bash
# Clear cache
rm -rf node_modules dist
npm install
npm run build
```

#### 5. CORS Errors

```bash
# Check CORS configuration in backend
# Ensure frontend URL is in allowed origins
```

### Logs

```bash
# Backend logs
pm2 logs yalla-backend

# Systemd logs
journalctl -u yalla-backend -f

# Docker logs
docker-compose logs -f backend
```

### Performance Issues

```bash
# Check database queries
psql -U postgres -d yalla -c "SELECT * FROM pg_stat_activity;"

# Check slow queries
psql -U postgres -d yalla -c "SELECT query, calls, total_time FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"

# Check server resources
htop
```

---

## 📞 Support

### Documentation

- [README.md](./README.md) - Project overview
- [PRD.md](./PRD.md) - Product requirements
- [STATE.md](./STATE.md) - Project status
- [backend/README.md](./backend/README.md) - Backend API documentation

### Contact

- **Email**: support@yalla.com
- **Documentation**: https://docs.yalla.com
- **Status Page**: https://status.yalla.com

---

<div align="center">

## 🚀 Deployment Complete

**Your Yalla MVP is now production-ready!**

### Quick Start
```bash
# 1. Clone repository
git clone <repository-url>
cd yalla-mvp

# 2. Install dependencies
cd backend && npm install
cd ../frontend && npm install

# 3. Configure environment
cd ../backend
cp .env.example .env
nano .env

# 4. Setup database
npm run migrate
npm run seed

# 5. Start servers
npm run dev  # Backend
cd ../frontend && npm run dev  # Frontend
```

### Production Deployment
```bash
# 1. Build
cd backend && npm run build
cd ../frontend && npm run build

# 2. Deploy
# Follow your preferred deployment method above
```

---

**Built with ❤️ by a World-Class Product Engineering Team**

[README](./README.md) • [STATE](./STATE.md) • [Backend Docs](./backend/README.md)

</div>

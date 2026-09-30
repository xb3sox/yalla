# Yalla Backend API

Production-ready backend API for Yalla MVP.

## 🚀 Features

- ✅ **Express.js** with TypeScript
- ✅ **PostgreSQL** database with migrations
- ✅ **JWT Authentication** with refresh tokens
- ✅ **Role-based Authorization** (participant, host, operations, support, trust_safety, admin)
- ✅ **Input Validation** with Zod
- ✅ **Error Handling** with custom error classes
- ✅ **Rate Limiting** for API protection
- ✅ **Security Headers** with Helmet
- ✅ **CORS** configured
- ✅ **Logging** with Winston
- ✅ **Stripe Integration** ready
- ✅ **Email/SMS Notifications** ready

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm 9+

## 🛠️ Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
nano .env
```

## 🗄️ Database Setup

```bash
# Create database
createdb yalla

# Run migrations
npm run migrate

# Seed database (optional)
npm run seed
```

## 🚀 Development

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 📚 API Endpoints

### Authentication

- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/refresh` - Refresh access token
- `GET /api/v1/auth/me` - Get current user (requires auth)
- `PUT /api/v1/auth/preferences` - Update preferences (requires auth)
- `GET /api/v1/auth/export` - Export user data (requires auth)
- `DELETE /api/v1/auth/account` - Delete account (requires auth)

### Experiences

- `GET /api/v1/experiences` - Get all published experiences
- `GET /api/v1/experiences/search` - Search experiences
- `GET /api/v1/experiences/:id` - Get experience by ID
- `POST /api/v1/experiences` - Create experience (staff only)
- `PUT /api/v1/experiences/:id` - Update experience (staff only)
- `DELETE /api/v1/experiences/:id` - Delete experience (staff only)

### Health Check

- `GET /health` - Health check endpoint

## 🔐 Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <access_token>
```

### Token Refresh

When access token expires, use refresh token to get new tokens:

```bash
POST /api/v1/auth/refresh
{
  "refreshToken": "<refresh_token>"
}
```

## 👥 User Roles

- **participant** - Regular user (default)
- **host** - Experience host
- **operations** - Operations staff
- **support** - Support staff
- **trust_safety** - Trust & Safety staff
- **admin** - System administrator

## 🗄️ Database Schema

### Tables

- `users` - User accounts
- `experiences` - Experience listings
- `reservations` - Booking reservations
- `feedbacks` - User feedback
- `favorites` - User favorites
- `blocks` - User blocks
- `support_requests` - Support tickets
- `safety_cases` - Safety case reports
- `notifications` - User notifications
- `audit_events` - Audit log

## 🌍 Environment Variables

See `.env.example` for all available configuration options.

### Required Variables

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT signing
- `STRIPE_SECRET_KEY` - Stripe API key (for payments)

### Optional Variables

- `SMTP_*` - Email configuration
- `TWILIO_*` - SMS configuration
- `REDIS_URL` - Redis connection (for sessions/caching)
- `SENTRY_DSN` - Error tracking

## 📊 Monitoring

- **Logging**: Winston (console + file)
- **Error Tracking**: Sentry (optional)
- **Performance**: New Relic (optional)

## 🚢 Deployment

### Build

```bash
npm run build
```

### Start

```bash
npm start
```

### Docker (optional)

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist

EXPOSE 3000

CMD ["node", "dist/server.js"]
```

## 🔒 Security

- ✅ Password hashing with bcrypt (12 rounds)
- ✅ JWT tokens with expiration
- ✅ Rate limiting (100 requests per 15 minutes)
- ✅ Helmet security headers
- ✅ CORS configured
- ✅ Input validation with Zod
- ✅ SQL injection protection (parameterized queries)
- ✅ XSS protection

## 📝 License

Proprietary - All rights reserved.

---

**Built with ❤️ by Yalla Team**

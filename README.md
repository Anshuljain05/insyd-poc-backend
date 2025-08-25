# Insyd Notification System - Backend API

## Overview

This is the backend API for the Insyd Notification System, built with Node.js, Express, TypeScript, and PostgreSQL. It provides real-time notification functionality with WebSocket support.

## 🚀 Live Demo

- **Backend API**: https://api-production-3aea.up.railway.app/
- **Health Check**: https://api-production-3aea.up.railway.app/health
- **Frontend**: https://insyd-poc-frontend-nh4cpujbp-anshuljain05s-projects.vercel.app/

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   PostgreSQL    │
│   (Vercel)      │◄──►│   (Railway)     │◄──►│   (Railway)     │
│   Next.js       │    │   Express.js    │    │   Database      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │
         │                       │
         └───────WebSocket────────┘
```

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Real-time**: WebSocket (ws library)
- **Email**: SMTP integration
- **Hosting**: Railway (Production)

## 📁 Project Structure

```
src/
├── index.ts              # Main server entry point
├── types/               # TypeScript type definitions
│   └── index.ts
├── services/            # Business logic
│   ├── notification-service.ts
│   └── email-service.ts
├── repositories/        # Data access layer
│   └── notification-repository.ts
prisma/
├── schema.prisma       # Database schema
└── migrations/         # Database migrations
scripts/
└── test-smtp.js       # Email testing script
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL (for local development)

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd insyd-notification-backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database and SMTP settings

# Run database migrations
npx prisma migrate dev
npx prisma generate

# Start development server
npm run dev
```

### Environment Variables
Create a `.env` file with:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/notification_system"
PORT=3001
EMAIL_FROM="notifications@example.com"
SMTP_HOST="smtp.mailtrap.io"
SMTP_PORT=2525
SMTP_USER="your_smtp_user"
SMTP_PASS="your_smtp_password"
```

## 📚 API Reference

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Server health check |
| POST | `/v1/notifications/events` | Create notification from event |
| GET | `/v1/notifications?userId={id}` | Get user notifications |
| POST | `/v1/notifications/{id}/read` | Mark notification as read |
| POST | `/v1/notifications/read-all?userId={id}` | Mark all notifications as read |
| GET | `/v1/notifications/preferences?userId={id}` | Get user preferences |
| PUT | `/v1/notifications/preferences` | Update user preferences |

### WebSocket Connection
- **Local Development**: `ws://localhost:3001?userId={userId}`
- **Production**: `wss://api-production-3aea.up.railway.app?userId={userId}`
- **Messages**: JSON format with `type` and `payload` fields

### Example API Usage

**Create a notification (Local Development):**
```bash
curl -X POST http://localhost:3001/v1/notifications/events \
  -H "Content-Type: application/json" \
  -d '{
    "actorId": "user123",
    "verb": "social.like",
    "objectId": "post456",
    "contextJson": {"recipientId": "user789"},
    "idempotencyKey": "unique-key-123"
  }'
```

**Create a notification (Production):**
```bash
curl -X POST https://api-production-3aea.up.railway.app/v1/notifications/events \
  -H "Content-Type: application/json" \
  -d '{
    "actorId": "user123",
    "verb": "social.like",
    "objectId": "post456",
    "contextJson": {"recipientId": "user789"},
    "idempotencyKey": "unique-key-123"
  }'
```

**Get notifications:**
```bash
# Local
curl http://localhost:3001/v1/notifications?userId=user789

# Production  
curl https://api-production-3aea.up.railway.app/v1/notifications?userId=user789
```

## 🗄️ Database Schema

### Notification Types
- `SOCIAL` - Likes, comments, mentions
- `SYSTEM` - Updates, maintenance, alerts  
- `COLLABORATION` - Team invites, project updates
- `OPPORTUNITY` - Job matches, recommendations

### Priority Levels
- `LOW` - General updates, tips
- `MEDIUM` - Standard notifications  
- `HIGH` - Important alerts, deadlines
- `URGENT` - Critical system alerts

## 🔧 Development

### Available Scripts
```bash
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm run start        # Start production server
npm run migrate      # Run database migrations
npm run test         # Run tests (if available)
```

### Database Management
```bash
# View data in Prisma Studio
npx prisma studio

# Reset database
npx prisma migrate reset

# Apply migrations
npx prisma migrate dev --name "your_migration_name"

# Generate Prisma client
npx prisma generate
```

## 📨 Email Configuration

The system supports SMTP email notifications. Configure your SMTP settings in the `.env` file:

```env
EMAIL_FROM="notifications@yourcompany.com"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your_email@gmail.com"
SMTP_PASS="your_app_password"
```

Test email configuration:
```bash
node scripts/test-smtp.js
```

## 🚀 Deployment

### Railway Deployment
1. Connect your GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Railway will automatically deploy on git push

### Environment Variables for Production
```env
DATABASE_URL=<railway-postgresql-url>
PORT=3001
EMAIL_FROM=notifications@yourcompany.com
SMTP_HOST=<your-smtp-host>
SMTP_PORT=<your-smtp-port>
SMTP_USER=<your-smtp-user>
SMTP_PASS=<your-smtp-password>
```

## 🐛 Troubleshooting

### Common Issues

**Database Connection Failed**
```
Error: P1001: Can't reach database server
```
- Ensure PostgreSQL is running
- Check DATABASE_URL format
- Verify network connectivity

**Port Already in Use**
```
Error: listen EADDRINUSE: address already in use :::3001
```
- Check if another process is using port 3001
- Kill the process or use a different port

**SMTP Authentication Failed**
```
Error: Invalid login: 535 5.7.0 Invalid credentials
```
- Verify SMTP credentials
- Check if 2FA is enabled (use app passwords)
- Test with scripts/test-smtp.js

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔗 Related

- **Frontend Repository**: Frontend web application available separately
- **Live Demo**: https://notification-frontend-5a262wn8p-anshuljain05s-projects.vercel.app/
- **API Health Check**: https://api-production-3aea.up.railway.app/health

## 📚 Additional Resources

- **Railway Deployment Guide**: See `RAILWAY_TROUBLESHOOTING.md` in this repository
- **Environment Setup**: See `.env.example` for configuration template
- **Prisma Documentation**: https://www.prisma.io/docs/

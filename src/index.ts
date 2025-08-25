import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { PrismaClient } from '@prisma/client';
import { NotificationRepository } from './repositories/notification-repository';
import { NotificationService } from './services/notification-service';
import { EmailService } from './services/email-service';
import { Event } from './types';

require('dotenv').config();

import { config } from '../config/environment';

const app = express();
const server = createServer(app);

// Initialize Prisma with error handling
const prisma = new PrismaClient({
  log: ['error', 'warn'],
  errorFormat: 'minimal',
});

const notificationRepo = new NotificationRepository(prisma);
const notificationService = new NotificationService(notificationRepo, server);
const emailService = new EmailService();

// Initialize email service for notification delivery (non-blocking)
emailService.verifyConnection().catch(error => {
  console.warn('Email service verification failed (non-critical):', error.message);
});

// Configure CORS with production-safe defaults
const corsOptions = {
  origin: [
    config.frontendUrl,
    'https://notification-frontend-5a262wn8p-anshuljain05s-projects.vercel.app',
    'https://insyd-poc-frontend-nh4cpujbp-anshuljain05s-projects.vercel.app',
    'http://localhost:3000',
    'http://localhost:3001'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'User-Agent']
};

app.use(cors(corsOptions));
app.use(express.json());

// Health check with improved error handling
app.get('/health', async (_req, res) => {
  try {
    // Quick DB ping with timeout
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => setTimeout(() => reject(new Error('DB timeout')), 5000))
    ]);
    res.json({ 
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (err) {
    console.error('Health check failed:', err);
    res.status(500).json({ 
      status: 'error', 
      error: String(err),
      timestamp: new Date().toISOString()
    });
  }
});

// Diagnostic endpoint for environment configuration
app.get('/debug/env', (_req, res) => {
  res.json({
    nodeEnv: process.env.NODE_ENV,
    port: process.env.PORT,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    databaseUrlPrefix: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 20) + '...' : 'undefined',
    frontendUrl: config.frontendUrl,
    timestamp: new Date().toISOString()
  });
});

// Event ingestion endpoint
app.post('/v1/notifications/events', async (req, res) => {
  try {
    const event: Event = req.body;
    const notification = await notificationService.handleEvent(event);
    res.json(notification);
  } catch (error) {
    console.error('Error handling event:', error);
    res.status(500).json({ error: 'Failed to process event' });
  }
});

// Query notifications
app.get('/v1/notifications', async (req, res) => {
  try {
    const recipientId = req.query.userId as string;
    const isRead = req.query.is_read ? req.query.is_read === 'true' : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

    if (!recipientId) {
      res.status(400).json({ error: 'userId is required' });
      return;
    }

    const notifications = await notificationRepo.getNotifications(
      recipientId,
      isRead,
      limit
    );
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark notification as read
app.post('/v1/notifications/:id/read', async (req, res) => {
  try {
    const notification = await notificationRepo.markAsRead(req.params.id);
    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
app.post('/v1/notifications/read-all', async (req, res) => {
  try {
    const recipientId = req.query.userId as string;
    if (!recipientId) {
      res.status(400).json({ error: 'userId is required' });
      return;
    }

    await notificationRepo.markAllAsRead(recipientId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

// Get preferences
app.get('/v1/notifications/preferences', async (req, res) => {
  try {
    const userId = req.query.userId as string;
    if (!userId) {
      res.status(400).json({ error: 'userId is required' });
      return;
    }

    const preferences = await notificationRepo.getPreferences(userId);
    res.json(preferences);
  } catch (error) {
    console.error('Error fetching preferences:', error);
    res.status(500).json({ error: 'Failed to fetch preferences' });
  }
});

// Update preferences
app.put('/v1/notifications/preferences', async (req, res) => {
  try {
    const preferences = await notificationRepo.updatePreferences(req.body);
    res.json(preferences);
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

const port = process.env.PORT || 3001;

// Database initialization and migration
async function initializeDatabase() {
  try {
    console.log('🔄 Connecting to database...');
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Run pending migrations in production
    if (process.env.NODE_ENV === 'production') {
      console.log('🔄 Running database migrations...');
      const { exec } = require('child_process');
      await new Promise((resolve, reject) => {
        exec('npx prisma migrate deploy', (error: any, stdout: any) => {
          if (error) {
            console.error('❌ Migration failed:', error);
            reject(error);
          } else {
            console.log('✅ Migrations completed:', stdout);
            resolve(stdout);
          }
        });
      });
    }
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

// Start server with proper error handling
async function startServer() {
  try {
    // Initialize database first
    await initializeDatabase();
    
    // Start the server
    server.listen(Number(port), '0.0.0.0', () => {
      console.log(`🚀 Notification API server running on port ${port}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://localhost:${port}/health`);
    });

    // Graceful shutdown handling
    process.on('SIGTERM', async () => {
      console.log('📥 SIGTERM received, shutting down gracefully...');
      server.close(async () => {
        await prisma.$disconnect();
        console.log('✅ Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      console.log('📥 SIGINT received, shutting down gracefully...');
      server.close(async () => {
        await prisma.$disconnect();
        console.log('✅ Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the application
startServer();

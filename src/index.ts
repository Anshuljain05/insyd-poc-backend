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
const prisma = new PrismaClient();
const notificationRepo = new NotificationRepository(prisma);
const notificationService = new NotificationService(notificationRepo, server);
const emailService = new EmailService();

// Initialize email service for notification delivery
emailService.verifyConnection();

// Configure CORS
const corsOptions = {
  origin: [
    config.frontendUrl,
    'http://localhost:3000',
    'http://localhost:3001'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'User-Agent']
};

app.use(cors(corsOptions));
app.use(express.json());

// Health check
app.get('/health', async (_req, res) => {
  try {
    // Quick DB ping
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
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
server.listen(port, () => {
  console.log(`Notification API server running on port ${port}`);
});

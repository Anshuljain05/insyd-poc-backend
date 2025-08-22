export interface Event {
  actorId: string;
  verb: string;
  objectId: string;
  contextJson: Record<string, any>;
  targets?: string[];
  timestamp?: Date;
  idempotencyKey: string;
}

import { Notification as PrismaNotification } from '@prisma/client';

export type Notification = PrismaNotification;

export interface NotificationPreferences {
  userId: string;
  channels: {
    inApp: boolean;
    email: boolean;
  };
  types: {
    social: boolean;
    collaboration: boolean;
    system: boolean;
  };
  digestCadence: 'none' | 'daily' | 'weekly';
  quietHours?: {
    start: string;
    end: string;
    timezone: string;
  };
}

export interface DeliveryStatus {
  id: string;
  notificationId: string;
  channel: 'email' | 'in-app';
  status: 'pending' | 'sent' | 'failed' | 'delivered';
  attempts: number;
  providerId?: string;
  lastError?: string;
  createdAt: Date;
  updatedAt: Date;
}

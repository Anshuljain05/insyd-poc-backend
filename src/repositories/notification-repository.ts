import { PrismaClient, Prisma } from '@prisma/client';
import { NotificationPreferences } from '../types';

export class NotificationRepository {
  constructor(private prisma: PrismaClient) {}

  async createNotification(notification: Prisma.NotificationCreateInput) {
    return this.prisma.notification.create({
      data: notification,
    });
  }

  async getNotifications(recipientId: string, isRead?: boolean, limit = 50) {
    return this.prisma.notification.findMany({
      where: {
        recipientId,
        ...(isRead !== undefined ? { isRead } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        deliveries: true,
      },
    });
  }

  async markAsRead(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllAsRead(recipientId: string) {
    return this.prisma.notification.updateMany({
      where: { recipientId, isRead: false },
      data: { isRead: true },
    });
  }

  async getPreferences(userId: string) {
    const prefs = await this.prisma.preference.findUnique({
      where: { userId },
    });

    if (!prefs) {
      // Return default preferences
      return {
        userId,
        channels: { inApp: true, email: true },
        types: { social: true, collaboration: true, system: true },
        digestCadence: 'daily',
      };
    }

    return {
      userId: prefs.userId,
      channels: prefs.channelsJson as NotificationPreferences['channels'],
      types: prefs.typesJson as NotificationPreferences['types'],
      digestCadence: prefs.digestCadence,
      quietHours: prefs.quietHours as NotificationPreferences['quietHours'],
    };
  }

  async updatePreferences(preferences: NotificationPreferences) {
    const { userId, channels, types, digestCadence, quietHours } = preferences;
    return this.prisma.preference.upsert({
      where: { userId },
      update: {
        channelsJson: channels,
        typesJson: types,
        digestCadence,
        quietHours: quietHours ? quietHours : Prisma.JsonNull,
      },
      create: {
        userId,
        channelsJson: channels,
        typesJson: types,
        digestCadence,
        quietHours: quietHours ? quietHours : Prisma.JsonNull,
      },
    });
  }
}

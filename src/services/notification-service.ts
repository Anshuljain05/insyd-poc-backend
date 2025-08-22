import { Server as WebSocketServer, WebSocket } from 'ws';
import { Event } from '../types';
import { NotificationRepository } from '../repositories/notification-repository';
import { NotificationType, Notification, Prisma } from '@prisma/client';

export class NotificationService {
  private wss: WebSocketServer;
  private connections: Map<string, Array<WebSocket>> = new Map();

  constructor(
    private repository: NotificationRepository,
    server: any
  ) {
    this.wss = new WebSocketServer({ server });
    this.setupWebSocket();
  }

  private setupWebSocket() {
    this.wss.on('connection', (ws, req) => {
      const userId = new URL(req.url!, `http://${req.headers.host}`).searchParams.get('userId');
      
      if (!userId) {
        ws.close();
        return;
      }

      this.addConnection(userId, ws);

      ws.on('close', () => {
        this.removeConnection(userId, ws);
      });
    });
  }

  private addConnection(userId: string, ws: WebSocket) {
    if (!this.connections.has(userId)) {
      this.connections.set(userId, []);
    }
    this.connections.get(userId)!.push(ws);
  }

  private removeConnection(userId: string, ws: WebSocket) {
    const userConnections = this.connections.get(userId);
    if (userConnections) {
      this.connections.set(
        userId,
        userConnections.filter((conn) => conn !== ws)
      );
    }
  }

  private notifyUser(userId: string, notification: Notification) {
    const userConnections = this.connections.get(userId);
    if (userConnections) {
      const message = JSON.stringify({
        type: 'notification.new',
        payload: notification,
      });

      userConnections.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
        }
      });
    }
  }

  async handleEvent(event: Event) {
    // Simple implementation - in a real system, this would include:
    // 1. Resolving recipients based on event context
    // 2. Checking user preferences
    // 3. Applying rate limits
    // 4. Handling aggregation windows

    const notification: Prisma.NotificationCreateInput = {
      recipientId: event.targets?.[0] || event.contextJson.recipientId,
      type: this.determineNotificationType(event.verb),
      title: this.generateTitle(event),
      body: this.generateBody(event),
      dataJson: {
        actorId: event.actorId,
        verb: event.verb,
        objectId: event.objectId,
        context: event.contextJson,
      },
      aggregatedFrom: [],
      priority: this.determinePriority(event),
      isRead: false,
      isArchived: false,
    };

    const created = await this.repository.createNotification(notification);
    this.notifyUser(notification.recipientId, created);
    return created;
  }

  private determineNotificationType(verb: string): NotificationType {
    if (verb.startsWith('social.')) return NotificationType.SOCIAL;
    if (verb.startsWith('collab.')) return NotificationType.COLLABORATION;
    return NotificationType.SYSTEM;
  }

  private determinePriority(event: Event): number {
    // Simple priority determination
    if (event.verb.includes('security') || event.verb.includes('access')) return 1;
    if (event.verb.includes('mention')) return 2;
    return 3;
  }

  private generateTitle(event: Event): string {
    // Simple title generation - in a real system, this would use a template engine
    return `New ${event.verb.replace('.', ' ')} notification`;
  }

  private generateBody(event: Event): string {
    // Simple body generation - in a real system, this would use a template engine
    return `User ${event.actorId} performed ${event.verb} on ${event.objectId}`;
  }
}

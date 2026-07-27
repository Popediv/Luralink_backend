
import { prisma } from '../config/db.js';
import { log } from '../utils/logger.js';

class NotificationService {
  /**
   * Get all notifications for a user with pagination
   */
  static async getUserNotifications(userId, options = {}) {
    try {
      const { limit = 10, offset = 0, unreadOnly = false } = options;

      const where = { recipientId: userId };
      if (unreadOnly) {
        where.isRead = false;
      }

      const notifications = await prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      });

      return notifications;
    } catch (error) {
      log('Error getting user notifications', { error: error.message });
      throw error;
    }
  }

  /**
   * Get a single notification by ID (verify ownership)
   */
  static async getNotificationById(id, userId) {
    try {
      const notification = await prisma.notification.findFirst({
        where: {
          id,
          recipientId: userId,
        },
      });

      return notification;
    } catch (error) {
      log('Error getting notification by id', { error: error.message });
      throw error;
    }
  }

  /**
   * Create a new notification
   */
  static async createNotification(data) {
    try {
      const { recipientId, title, message, type, relatedId } = data;

      // Verify recipient exists
      const recipient = await prisma.user.findUnique({
        where: { id: recipientId },
      });

      if (!recipient) {
        throw new Error('Recipient user not found');
      }

      const notification = await prisma.notification.create({
        data: {
          recipientId,
          title,
          message,
          type,
          relatedId,
          isRead: false,
          createdAt: new Date(),
        },
      });

      log('Notification created', { notificationId: notification.id, recipientId });
      return notification;
    } catch (error) {
      log('Error creating notification', { error: error.message });
      throw error;
    }
  }

  /**
   * Central trigger: save to DB and send push notification
   */
  static async triggerNotification(payload) {
    try {
      const { recipientId, title, message, type, relatedId } = payload;

      // Save notification in DB
      const notification = await this.createNotification({ recipientId, title, message, type, relatedId });

      // Attempt to send push notification (best-effort)
      try {
        await this.sendPushNotification(recipientId, {
          title,
          message,
          notificationId: notification.id,
          type,
        });
      } catch (pushErr) {
        log('Push send failed (non-blocking)', { error: pushErr.message, recipientId });
      }

      return notification;
    } catch (error) {
      log('Error triggering notification', { error: error.message });
      throw error;
    }
  }

  /**
   * Send push notification to user's registered device tokens (no-op fallback)
   */
  static async sendPushNotification(userId, data) {
    try {
      // Fetch user push tokens; field name depends on your schema (e.g. pushTokens)
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { pushTokens: true } });

      if (!user || !user.pushTokens || user.pushTokens.length === 0) {
        log('No push tokens for user', { userId });
        return null;
      }

      // Integrate with your push provider here (FCM, OneSignal, etc.)
      // Example (pseudo): await fcm.sendMulticast({ tokens: user.pushTokens, notification: { title: data.title, body: data.message }, data });

      log('Simulated push sent', { userId, tokens: user.pushTokens.length });
      return true;
    } catch (error) {
      log('Error sending push notification', { error: error.message, userId });
      // Don't throw to avoid breaking main flow
      return null;
    }
  }

  /**
   * Create bulk notifications (for multiple recipients)
   */
  static async createBulkNotifications(data) {
    try {
      const { recipientIds, title, message, type, relatedId } = data;

      const notifications = await prisma.notification.createMany({
        data: recipientIds.map((recipientId) => ({
          recipientId,
          title,
          message,
          type,
          relatedId,
          isRead: false,
          createdAt: new Date(),
        })),
      });

      log('Bulk notifications created', { count: notifications.count });
      return notifications;
    } catch (error) {
      log('Error creating bulk notifications', { error: error.message });
      throw error;
    }
  }

  /**
   * Mark a notification as read
   */
  static async markAsRead(id, userId) {
    try {
      const notification = await prisma.notification.updateMany({
        where: {
          id,
          recipientId: userId,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      if (notification.count === 0) {
        return null;
      }

      return await this.getNotificationById(id, userId);
    } catch (error) {
      log('Error marking notification as read', { error: error.message });
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId) {
    try {
      const result = await prisma.notification.updateMany({
        where: {
          recipientId: userId,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      log('All notifications marked as read', { userId, count: result.count });
      return result.count;
    } catch (error) {
      log('Error marking all as read', { error: error.message });
      throw error;
    }
  }

  /**
   * Delete a notification
   */
  static async deleteNotification(id, userId) {
    try {
      const notification = await prisma.notification.findFirst({
        where: {
          id,
          recipientId: userId,
        },
      });

      if (!notification) {
        return null;
      }

      await prisma.notification.delete({
        where: { id },
      });

      log('Notification deleted', { notificationId: id });
      return notification;
    } catch (error) {
      log('Error deleting notification', { error: error.message });
      throw error;
    }
  }

  /**
   * Delete all notifications for a user
   */
  static async deleteAllNotifications(userId) {
    try {
      const result = await prisma.notification.deleteMany({
        where: {
          recipientId: userId,
        },
      });

      log('All notifications deleted', { userId, count: result.count });
      return result.count;
    } catch (error) {
      log('Error deleting all notifications', { error: error.message });
      throw error;
    }
  }

  /**
   * Get unread notification count
   */
  static async getUnreadCount(userId) {
    try {
      const count = await prisma.notification.count({
        where: {
          recipientId: userId,
          isRead: false,
        },
      });

      return count;
    } catch (error) {
      log('Error getting unread count', { error: error.message });
      throw error;
    }
  }

  /**
   * Search notifications by query and type
   */
  static async searchNotifications(userId, query, type = null, limit = 10) {
    try {
      const where = {
        recipientId: userId,
        OR: [{ title: { contains: query, mode: 'insensitive' } }, { message: { contains: query, mode: 'insensitive' } }],
      };

      if (type) {
        where.type = type;
      }

      const results = await prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      return results;
    } catch (error) {
      log('Error searching notifications', { error: error.message });
      throw error;
    }
  }

  /**
   * Get notifications by type
   */
  static async getNotificationsByType(userId, type, limit = 10) {
    try {
      const notifications = await prisma.notification.findMany({
        where: {
          recipientId: userId,
          type,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      return notifications;
    } catch (error) {
      log('Error getting notifications by type', { error: error.message });
      throw error;
    }
  }

  /**
   * Get notifications by related ID (e.g., payment, shift, application)
   */
  static async getNotificationsByRelatedId(userId, relatedId) {
    try {
      const notifications = await prisma.notification.findMany({
        where: {
          recipientId: userId,
          relatedId,
        },
        orderBy: { createdAt: 'desc' },
      });

      return notifications;
    } catch (error) {
      log('Error getting notifications by related id', { error: error.message });
      throw error;
    }
  }

  /**
   * Delete old notifications (older than specified days)
   */
  static async deleteOldNotifications(days = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const result = await prisma.notification.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
        },
      });

      log('Old notifications deleted', { days, count: result.count });
      return result.count;
    } catch (error) {
      log('Error deleting old notifications', { error: error.message });
      throw error;
    }
  }
}


export default NotificationService;

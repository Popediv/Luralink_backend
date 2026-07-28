
import NotificationService from '../services/notification.service.js';
import { successResponse, errorResponse } from '../utils/responseFormatter.js';
import { logger } from '../utils/logger.js';

class NotificationController {
  /**
   * Get all notifications for the authenticated user
   */
  static async list(req, res) {
    try {
      const userId = req.user.id;
      const { limit = 10, offset = 0, unreadOnly = false } = req.query;

      const notifications = await NotificationService.getUserNotifications(
        userId,
        { limit: parseInt(limit), offset: parseInt(offset), unreadOnly: unreadOnly === 'true' }
      );

      const count = await NotificationService.getUnreadCount(userId);

      return successResponse(res, 200, {
        notifications,
        unreadCount: count,
        total: notifications.length,
      });
    } catch (error) {
      logger.error('Error fetching notifications', { error: error.message });
      return errorResponse(res, 500, 'Failed to fetch notifications');
    }
  }

  /**
   * Get a single notification by ID
   */
  static async getOne(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const notification = await NotificationService.getNotificationById(id, userId);

      if (!notification) {
        return errorResponse(res, 404, 'Notification not found');
      }

      return successResponse(res, 200, notification);
    } catch (error) {
      logger.error('Error fetching notification', { error: error.message });
      return errorResponse(res, 500, 'Failed to fetch notification');
    }
  }

  /**
   * Create a new notification (admin/system only)
   */
  static async create(req, res) {
    try {
      const { recipientId, title, message, type, relatedId } = req.body;

      // Validation
      if (!recipientId || !title || !message || !type) {
        return errorResponse(res, 400, 'Missing required fields: recipientId, title, message, type');
      }

      const allowedTypes = ['info', 'warning', 'success', 'error', 'payment', 'shift', 'application'];
      if (!allowedTypes.includes(type)) {
        return errorResponse(res, 400, `Invalid notification type. Allowed: ${allowedTypes.join(', ')}`);
      }

      const notification = await NotificationService.createNotification({
        recipientId,
        title,
        message,
        type,
        relatedId: relatedId || null,
      });

      return successResponse(res, 201, notification);
    } catch (error) {
      logger.error('Error creating notification', { error: error.message });
      return errorResponse(res, 500, 'Failed to create notification');
    }
  }

  /**
   * Mark a notification as read
   */
  static async markAsRead(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const notification = await NotificationService.markAsRead(id, userId);

      if (!notification) {
        return errorResponse(res, 404, 'Notification not found');
      }

      return successResponse(res, 200, notification);
    } catch (error) {
      logger.error('Error marking notification as read', { error: error.message });
      return errorResponse(res, 500, 'Failed to mark notification as read');
    }
  }

  /**
   * Mark all notifications as read for the user
   */
  static async markAllAsRead(req, res) {
    try {
      const userId = req.user.id;

      const count = await NotificationService.markAllAsRead(userId);

      return successResponse(res, 200, { message: `${count} notifications marked as read`, count });
    } catch (error) {
      logger.error('Error marking all notifications as read', { error: error.message });
      return errorResponse(res, 500, 'Failed to mark notifications as read');
    }
  }

  /**
   * Delete a specific notification
   */
  static async delete(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const notification = await NotificationService.deleteNotification(id, userId);

      if (!notification) {
        return errorResponse(res, 404, 'Notification not found');
      }

      return successResponse(res, 200, { message: 'Notification deleted successfully' });
    } catch (error) {
      logger.error('Error deleting notification', { error: error.message });
      return errorResponse(res, 500, 'Failed to delete notification');
    }
  }

  /**
   * Delete all notifications for the user
   */
  static async deleteAll(req, res) {
    try {
      const userId = req.user.id;

      const count = await NotificationService.deleteAllNotifications(userId);

      return successResponse(res, 200, { message: `${count} notifications deleted successfully`, count });
    } catch (error) {
      logger.error('Error deleting all notifications', { error: error.message });
      return errorResponse(res, 500, 'Failed to delete notifications');
    }
  }

  /**
   * Get unread notification count
   */
  static async getUnreadCount(req, res) {
    try {
      const userId = req.user.id;

      const count = await NotificationService.getUnreadCount(userId);

      return successResponse(res, 200, { unreadCount: count });
    } catch (error) {
      logger.error('Error fetching unread count', { error: error.message });
      return errorResponse(res, 500, 'Failed to fetch unread count');
    }
  }

  /**
   * Search notifications
   */
  static async search(req, res) {
    try {
      const userId = req.user.id;
      const { query, type, limit = 10 } = req.query;

      if (!query) {
        return errorResponse(res, 400, 'Search query is required');
      }

      const results = await NotificationService.searchNotifications(userId, query, type, parseInt(limit));

      return successResponse(res, 200, { results, total: results.length });
    } catch (error) {
      logger.error('Error searching notifications', { error: error.message });
      return errorResponse(res, 500, 'Failed to search notifications');
    }
  }
}


export default NotificationController;

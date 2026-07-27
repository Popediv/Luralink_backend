
import express from 'express';
import NotificationController from '../controllers/notification.controller.js';
import {authMiddleware} from '../middleware/auth.middleware.js';

const router = express.Router();

// All notification routes require authentication
router.use(authMiddleware);

// Get all notifications
router.get('/', NotificationController.list);

// Get unread count
router.get('/unread-count', NotificationController.getUnreadCount);

// Search notifications
router.get('/search', NotificationController.search);

// Get single notification
router.get('/:id', NotificationController.getOne);

// Create notification
router.post('/', NotificationController.create);

// Mark as read
router.patch('/:id/mark-read', NotificationController.markAsRead);

// Mark all as read
router.patch('/mark-all-read', NotificationController.markAllAsRead);

// Delete notification
router.delete('/:id', NotificationController.delete);

// Delete all notifications
router.delete('/', NotificationController.deleteAll);


export default router;

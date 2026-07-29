import express from 'express';
import NotificationController from '../controllers/notification.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authMiddleware);

// Static routes MUST come before parameterised routes
router.get('/', NotificationController.list);
router.get('/unread-count', NotificationController.getUnreadCount);
router.get('/search', NotificationController.search);
router.patch('/mark-all-read', NotificationController.markAllAsRead);
router.delete('/all', NotificationController.deleteAll);

// Parameterised routes
router.get('/:id', NotificationController.getOne);
router.post('/', NotificationController.create);
router.patch('/:id/mark-read', NotificationController.markAsRead);
router.delete('/:id', NotificationController.delete);

export default router;

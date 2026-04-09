import express from 'express';
import { authenticate } from '../middlewares/auth'; // Import the new authentication middleware
import {
    createNotificationHandler,
    getUserNotificationsHandler,
    markNotificationAsReadHandler,
    deleteNotificationHandler
} from '../controllers/notification.controller';

const notificationRouter = express.Router();

// Create a new notification (using the dispatcher for multi-channel support)
notificationRouter.post('/create', createNotificationHandler);

/**
 * Get notifications for the current authenticated user.
 * We removed the :userId parameter to align with the "Transaction Method".
 * Now the user is identified securely via the Authorization token.
 */
notificationRouter.get('/user', authenticate, getUserNotificationsHandler);

// Mark notification as read (using the middleware to ensure only the owner can update)
notificationRouter.patch('/:id/read', authenticate, markNotificationAsReadHandler);

// Delete notification (using the middleware for security)
notificationRouter.delete('/:id', authenticate, deleteNotificationHandler);

export default notificationRouter;

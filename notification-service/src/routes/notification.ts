import express from 'express';
import {
    createNotificationHandler,
    getUserNotificationsHandler,
    markNotificationAsReadHandler,
    deleteNotificationHandler
} from '../controllers/notification.controller';

const notificationRouter = express.Router();

// Create a new notification (using the dispatcher for multi-channel support)
notificationRouter.post('/create', createNotificationHandler);

// Get notifications for a user
notificationRouter.get('/user/:userId', getUserNotificationsHandler);

// Mark notification as read
notificationRouter.patch('/:id/read', markNotificationAsReadHandler);

// Delete notification
notificationRouter.delete('/:id', deleteNotificationHandler);

export default notificationRouter;

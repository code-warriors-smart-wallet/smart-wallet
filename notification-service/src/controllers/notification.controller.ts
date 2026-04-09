import { Request, Response } from 'express';
import Notification from '../models/notification';
import { dispatchNotification } from '../services/notification-dispatcher';
import { getUserContext } from '../services/user-context.service';

export const createNotificationHandler = async (req: Request, res: Response): Promise<void> => {
    try {
        let { userId, userEmail, spaceId, title, type, message, actionUrl, userPreferences } = req.body;
        console.log(`[NOTIFICATION-SERVICE] Received notification request: ${type} for user ${userId}`);

        // If context is missing, fetch it from user-service
        if (!userEmail || !userPreferences) {
            const context = await getUserContext(userId);
            if (context) {
                userEmail = userEmail || context.email;
                userPreferences = userPreferences || context.preferences;
            }
        }

        const result = await dispatchNotification({
            userId,
            userEmail,
            spaceId,
            title,
            type,
            message,
            actionUrl,
            userPreferences
        });

        res.status(201).json({
            success: true,
            data: {
                message: 'Notification process completed',
                object: result
            },
            error: null
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            success: false,
            error: { message: 'Error dispatching notification: ' + errorMessage },
            data: null
        });
    }
};

export const getUserNotificationsHandler = async (req: Request, res: Response): Promise<void> => {
    try {
        // Now using req.user (populated by the authenticate middleware)
        // instead of getting it from req.params.
        const userId = (req as any).user.userId;
        
        console.log(`[NOTIFICATION-SERVICE] Fetching notifications for authenticated user: ${userId}`);
        const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });
        console.log(`[NOTIFICATION-SERVICE] Found ${notifications.length} notifications for user ${userId}`);

        res.status(200).json({
            success: true,
            data: {
                object: notifications
            },
            error: null
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            success: false,
            error: { message: 'Error fetching notifications: ' + errorMessage },
            data: null
        });
    }
};

export const markNotificationAsReadHandler = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = (req as any).user.userId;

        // Find the notification and ensure it belongs to the authenticated user
        const updatedNotification = await Notification.findOneAndUpdate(
            { _id: id, userId: userId }, // Both notification ID and User ID must match
            { isRead: true },
            { new: true }
        );

        if (!updatedNotification) {
            res.status(404).json({
                success: false,
                error: { message: 'Notification not found or unauthorized' },
                data: null
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: {
                message: 'Notification marked as read',
                object: updatedNotification
            },
            error: null
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            success: false,
            error: { message: 'Error updating notification: ' + errorMessage },
            data: null
        });
    }
};

export const deleteNotificationHandler = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = (req as any).user.userId;

        // Find the notification and ensure it belongs to the authenticated user before deleting
        const deletedNotification = await Notification.findOneAndDelete({ _id: id, userId: userId });

        if (!deletedNotification) {
            res.status(404).json({
                success: false,
                error: { message: 'Notification not found or unauthorized' },
                data: null
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: {
                message: 'Notification deleted successfully',
                object: deletedNotification
            },
            error: null
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            success: false,
            error: { message: 'Error deleting notification: ' + errorMessage },
            data: null
        });
    }
};

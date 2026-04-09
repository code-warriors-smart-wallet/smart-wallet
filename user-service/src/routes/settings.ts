import express, { Request, Response } from 'express';
import { authenticate } from '../middlewares/auth';
import User from '../models/user';
import { getUserNotificationPreferences, updateNotificationPreference } from '../services/notification-preference.service';

const settingsRouter = express.Router();

// Get user notification preferences
settingsRouter.get('/notifications', authenticate, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const preferences = await getUserNotificationPreferences(userId);

        res.status(200).json({
            success: true,
            data: {
                object: preferences
            },
            error: null
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            success: false,
            error: { message: 'Error fetching notification settings: ' + errorMessage },
            data: null
        });
    }
});

// Update a specific notification preference
settingsRouter.put('/notifications', authenticate, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { action, inAppEnabled, emailEnabled } = req.body;

        if (!action) {
            res.status(400).json({
                success: false,
                error: { message: 'Action is required' },
                data: null
            });
            return;
        }

        const updatedPreference = await updateNotificationPreference(userId, action, inAppEnabled, emailEnabled);

        res.status(200).json({
            success: true,
            data: {
                message: 'Notification preference updated successfully',
                object: updatedPreference
            },
            error: null
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            success: false,
            error: { message: 'Error updating notification settings: ' + errorMessage },
            data: null
        });
    }
});

// Get user context (email and preferences) for other services
settingsRouter.get('/context/:userId', authenticate, async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        
        // Find user to get email
        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({
                success: false,
                error: { message: 'User not found' },
                data: null
            });
            return;
        }

        // Get preferences
        const preferences = await getUserNotificationPreferences(userId);

        res.status(200).json({
            success: true,
            data: {
                object: {
                    email: user.email,
                    preferences: preferences
                }
            },
            error: null
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            success: false,
            error: { message: 'Error fetching user context: ' + errorMessage },
            data: null
        });
    }
});

export default settingsRouter;

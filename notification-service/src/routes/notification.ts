import express, { Request, Response } from 'express';
import Notification from '../models/notification';

const notificationRouter = express.Router();

/**
 * @route   POST /notification
 * @desc    Create a new in-app notification
 * @access  Internal (User-service)
 */
notificationRouter.post('/', async (req: Request, res: Response) => {
    try {
        const { userId, message, type } = req.body;

        if (!userId || !message) {
            res.status(400).json({
                success: false,
                error: { message: 'userId and message are required' }
            });
            return;
        }

        const notification = await Notification.create({
            userId,
            message,
            type: type || 'INFO'
        });

        res.status(201).json({
            success: true,
            data: notification
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: { message: error.message }
        });
    }
});

/**
 * @route   GET /notification/:userId
 * @desc    Fetch notifications for a user
 * @access  Public/User
 */
notificationRouter.get('/:userId', async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const { limit = 20, skip = 0 } = req.query;

        const notifications = await Notification.find({ userId })
            .sort({ createdAt: -1 })
            .limit(Number(limit))
            .skip(Number(skip));

        const total = await Notification.countDocuments({ userId });
        const unreadCount = await Notification.countDocuments({ userId, isRead: false });

        res.status(200).json({
            success: true,
            data: {
                notifications,
                total,
                unreadCount
            }
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: { message: error.message }
        });
    }
});

/**
 * @route   PATCH /notification/:notificationId/read
 * @desc    Mark a notification as read
 * @access  Public/User
 */
notificationRouter.patch('/:notificationId/read', async (req: Request, res: Response) => {
    try {
        const { notificationId } = req.params;

        const notification = await Notification.findByIdAndUpdate(
            notificationId,
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            res.status(404).json({
                success: false,
                error: { message: 'Notification not found' }
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: notification
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: { message: error.message }
        });
    }
});

/**
 * @route   PATCH /notification/user/:userId/read-all
 * @desc    Mark all notifications for a user as read
 * @access  Public/User
 */
notificationRouter.patch('/user/:userId/read-all', async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;

        await Notification.updateMany(
            { userId, isRead: false },
            { isRead: true }
        );

        res.status(200).json({
            success: true,
            message: 'All notifications marked as read'
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: { message: error.message }
        });
    }
});

export default notificationRouter;

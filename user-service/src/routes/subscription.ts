import express, { Request, Response } from 'express';
import User from '../models/user';
import Plan, { PlanType } from '../models/plan';
import Subscription, { SubscriptionStatus } from '../models/subscription';
import Payment from '../models/payment';
import { CreateSubscriptionRequest, SavePaymentRequest } from '../interfaces/requests';
import { NotificationService, NotificationType } from '../services/notification.service';

const subscriptionRouter = express.Router();

// Create a new subscription
// {
//     "email": "user@example.com",
//     "planId": "plan_id_here",
//     "autoRenew": "true"
// }
subscriptionRouter.post('/subscribe', async (req: Request, res: Response) => {
    try {
        const { email, planId, autoRenew }: CreateSubscriptionRequest = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            res.status(404).json({
                success: false,
                error: { message: 'User not found. email: ' + email },
                data: null
            });
            return;
        }

        // Check for existing active subscription
        const existingSubscription = await Subscription.findOne({
            userId: user._id,
            status: SubscriptionStatus.ACTIVE
        });

        if (existingSubscription) {
            // Auto-cancel the existing subscription
            await Subscription.findByIdAndUpdate(
                existingSubscription._id,
                {
                    status: SubscriptionStatus.CANCELLED,
                    cancelledAt: new Date(),
                    autoRenew: false
                }
            );
        }

        const plan = await Plan.findById(planId);
        if (!plan || !plan.active) {
            res.status(400).json({
                success: false,
                error: { message: 'Invalid or inactive plan' },
                data: null
            });
            return;
        }

        const startDate = new Date();
        const endDate = new Date();
        // Set end date based on billing cycle
        if (plan.name !== PlanType.STARTER) {
            endDate.setMonth(endDate.getMonth() + 1);
        }

        const subscription = await Subscription.create({
            userId: user._id,
            planId: plan._id,
            paymentId: null,
            startDate,
            endDate,
            lastBillingDate: startDate,
            nextBillingDate: endDate,
            status: plan.name === PlanType.STARTER ? SubscriptionStatus.ACTIVE : SubscriptionStatus.PENDING,
            autoRenew
        });

        res.status(201).json({
            success: true,
            data: { object: {...subscription.toObject(), email: user.email}, message: 'Subscription is successful' },
            error: null
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            success: false,
            error: { message: 'Error creating subscription: ' + errorMessage },
            data: null
        });
    }
});

// Activate a pending subscription
// {
//     "email": "user@example.com",
//     "paymentId": "payment_id_here"
// }
subscriptionRouter.post('/:subscriptionId/activate', async (req: Request, res: Response) => {
    try {
        const { subscriptionId } = req.params;
        const { email, paymentId } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            res.status(404).json({
                success: false,
                error: { message: 'User not found' },
                data: null
            });
            return;
        }

        const subscription = await Subscription.findOne({
            _id: subscriptionId,
            userId: user._id,
            status: SubscriptionStatus.PENDING
        });

        if (!subscription) {
            res.status(404).json({
                success: false,
                error: { message: 'Pending subscription not found' },
                data: null
            });
            return;
        }

        const payment = await Payment.findById(paymentId);
        // Note: Payment model might need validation logic
        if (!payment) {
            res.status(400).json({
                success: false,
                error: { message: 'Invalid payment method' },
                data: null
            });
            return;
        }

        await Subscription.updateMany(
            {
                userId: user._id,
                status: SubscriptionStatus.ACTIVE,
                _id: { $ne: subscriptionId }
            },
            {
                status: SubscriptionStatus.CANCELLED,
                cancelledAt: new Date(),
                autoRenew: false
            }
        );

        const activatedSubscription = await Subscription.findByIdAndUpdate(
            subscriptionId,
            {
                status: SubscriptionStatus.ACTIVE,
                paymentId
            },
            { new: true }
        ).populate('planId');

        // Trigger Notification
        if (activatedSubscription) {
            const plan = activatedSubscription.planId as any;
            await NotificationService.sendMultiChannelNotification(
                user._id.toString(),
                user.email,
                `Your ${plan.name} subscription is now active! Enjoy your premium features.`,
                'Subscription Activated',
                NotificationType.PLAN_CHANGE
            );
        }

        res.status(200).json({
            success: true,
            data: {
                object: activatedSubscription,
                message: 'Subscription activated successfully'
            },
            error: null
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            success: false,
            error: { message: 'Error activating subscription: ' + errorMessage },
            data: null
        });
    }
});

// Cancel a subscription
subscriptionRouter.patch('/:subscriptionId/cancel', async (req: Request, res: Response) => {
    try {
        const { subscriptionId } = req.params;
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            res.status(404).json({
                success: false,
                error: { message: 'User not found' },
                data: null
            });
            return;
        }

        const subscription = await Subscription.findOne({
            _id: subscriptionId,
            userId: user._id
        });

        if (!subscription) {
            res.status(404).json({
                success: false,
                error: { message: 'Subscription not found' },
                data: null
            });
            return;
        }

        if (subscription.status === SubscriptionStatus.CANCELLED) {
            res.status(400).json({
                success: false,
                error: { message: 'Subscription is already cancelled' },
                data: null
            });
            return;
        }

        const updatedSubscription = await Subscription.findByIdAndUpdate(
            subscriptionId,
            {
                status: SubscriptionStatus.CANCELLED,
                cancelledAt: new Date(),
                autoRenew: false
            },
            { new: true }
        );

        // When a user cancels, they are immediately moved to STARTER conceptually by the auth logic
        // but let's notify them.
        await NotificationService.sendMultiChannelNotification(
            user._id.toString(),
            user.email,
            `Your subscription has been cancelled. You will revert to the Starter plan.`,
            'Subscription Cancelled',
            NotificationType.PLAN_CHANGE
        );

        res.status(200).json({
            success: true,
            data: {
                object: updatedSubscription,
                message: 'Subscription cancelled successfully'
            },
            error: null
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            success: false,
            error: { message: 'Error cancelling subscription: ' + errorMessage },
            data: null
        });
    }
});

// Save payment method
subscriptionRouter.post('/payments', async (req: Request, res: Response) => {
    try {
        const { email, type, details, isDefault }: SavePaymentRequest = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            res.status(404).json({
                success: false,
                error: { message: 'User not found. email: ' + email },
                data: null
            });
            return;
        }

        if (isDefault) {
            await Payment.updateMany(
                { userId: user._id },
                { isDefault: false }
            );
        }

        const payment = await Payment.create({
            userId: user._id,
            type,
            details,
            isDefault
        });

        res.status(201).json({
            success: true,
            data: { message: 'Payment method saved successfully', object: payment },
            error: null
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            success: false,
            error: { message: 'Error saving payment method: ' + errorMessage },
            data: null
        });
    }
});

export default subscriptionRouter;
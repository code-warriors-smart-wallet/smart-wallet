import mongoose from 'mongoose';
import express, { Request, Response } from 'express';
import User from '../models/user';
import Plan, { PlanType } from '../models/plan';
import Subscription, { SubscriptionStatus } from '../models/subscription';
import Payment from '../models/payment';
import Invoice, { InvoiceStatus } from '../models/Invoice';
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
        console.log(">>>> Subscribing request received:", { email, planId, autoRenew });

        const user = await User.findOne({ email });
        if (!user) {
            console.log(">>>> User not found for email:", email);
            res.status(404).json({
                success: false,
                error: { message: 'Subscription failed: User not found for email ' + email },
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
            console.log(">>>> Cancelling existing subscription:", existingSubscription._id);
            await Subscription.findByIdAndUpdate(
                existingSubscription._id,
                {
                    status: SubscriptionStatus.CANCELLED,
                    cancelledAt: new Date(),
                    autoRenew: false
                }
            );
        }

        // Also cancel any other PENDING subscriptions to prevent late activations
        await Subscription.updateMany(
            { userId: user._id, status: SubscriptionStatus.PENDING },
            { status: SubscriptionStatus.CANCELLED, cancelledAt: new Date(), autoRenew: false }
        );

        console.log(">>>> Looking up plan with ID:", planId);
        const plan = await Plan.findById(planId);
        if (!plan) {
            console.log(">>>> Plan not found for ID:", planId);
            res.status(400).json({
                success: false,
                error: { message: 'Subscription failed: Invalid plan ID ' + planId },
                data: null
            });
            return;
        }
        if (!plan.active) {
            console.log(">>>> Plan is inactive:", plan.name);
            res.status(400).json({
                success: false,
                error: { message: 'Subscription failed: Plan ' + plan.name + ' is currently inactive' },
                data: null
            });
            return;
        }

        console.log(">>>> Plan found:", plan.name);

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

        // Send email notification for Starter plan (active immediately)
        const isStarter = plan.name.toLowerCase().includes('starter') || plan.monthly_price === 0;
        
        if (isStarter) {
            const isDowngrade = !!existingSubscription;
            const message = isDowngrade 
                ? `You have been downgraded to the ${plan.name} plan. Your previous premium subscription has been deactivated and you will no longer be charged for premium features.`
                : `Your plan has been successfully updated to the ${plan.name} plan!`;
            const subject = isDowngrade ? 'Subscription Downgraded' : 'Subscription Updated';

            console.log(`>>>> Sending ${subject} email to ${user.email}: ${message}`);

            NotificationService.sendMultiChannelNotification(
                user._id.toString(),
                user.email,
                message,
                subject,
                NotificationType.PLAN_CHANGE
            ).catch(err => console.error("Starter Notification failed:", err));
        }

        return res.status(201).json({
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
        console.log(`>>>> Activating subscription ${subscriptionId} for user ${email}`);
        
        const user = await User.findOne({ email });
        if (!user) {
            console.log(">>>> Activation failed: User not found");
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
            console.log(`>>>> Activation failed: Pending subscription ${subscriptionId} not found for user ${user._id}`);
            res.status(404).json({
                success: false,
                error: { message: 'Pending subscription not found' },
                data: null
            });
            return;
        }

        console.log(">>>> Found pending subscription, checking payment ID:", paymentId);

        let paymentExists = false;
        
        // Handle mock payment IDs or valid ObjectIds
        if (typeof paymentId === 'string' && paymentId.startsWith('mock_')) {
            paymentExists = true; 
        } else if (mongoose.Types.ObjectId.isValid(paymentId)) {
            const payment = await Payment.findById(paymentId);
            if (payment) paymentExists = true;
        }

        if (!paymentExists) {
            res.status(400).json({
                success: false,
                error: { message: 'Invalid payment method or payment not found' },
                data: null
            });
            return;
        }

        // Check if there is already a NEWER active subscription (e.g. user downgraded while this was paying)
        const newerSub = await Subscription.findOne({
            userId: subscription.userId,
            status: SubscriptionStatus.ACTIVE,
            createdAt: { $gt: subscription.createdAt }
        });

        if (newerSub) {
            console.log(">>>> Activation aborted: A newer active subscription already exists.");
            // Still cancel this pending one to clean up
            await Subscription.findByIdAndUpdate(subscriptionId, {
                status: SubscriptionStatus.CANCELLED,
                cancelledAt: new Date()
            });
            res.status(400).json({
                success: false,
                error: { message: 'A more recent subscription is already active. Activation aborted.' },
                data: null
            });
            return;
        }

        await Subscription.updateMany(
            {
                userId: user._id,
                status: { $in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.PENDING] },
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

        // Create Invoice Record
        if (activatedSubscription) {
            try {
                const plan = activatedSubscription.planId as any;
                await Invoice.create({
                    userId: user._id,
                    subscriptionId: activatedSubscription._id,
                    planId: plan._id,
                    paymentId: paymentId,
                    amount: plan.monthly_price || 0,
                    currency: plan.currency || 'LKR',
                    status: InvoiceStatus.PAID,
                    billingDate: new Date()
                });
            } catch (invoiceErr) {
                console.error("Error creating invoice record:", invoiceErr);
            }
        }

        // Trigger Notification in a separate try-catch so it doesn't fail the main response
        if (activatedSubscription) {
            try {
                const plan = activatedSubscription.planId as any;
                const planName = (plan.name || '').toString().trim();
                const isPremium = !planName.toLowerCase().includes('starter') && (plan.monthly_price || 0) > 0;
                
                const notificationMessage = isPremium 
                    ? `Your ${planName} subscription is now active! You now have full access to all premium features.`
                    : `Your ${planName} plan is now active. You are now on the free tier.`;

                console.log(`>>>> Sending Activation email to ${user.email}: ${notificationMessage}`);

                await NotificationService.sendMultiChannelNotification(
                    user._id.toString(),
                    user.email,
                    notificationMessage,
                    'Subscription Activated',
                    NotificationType.PLAN_CHANGE
                ).catch(err => console.error("Notification Promise failed:", err));
            } catch (notifyError) {
                console.error("Error in notification flow:", notifyError);
            }
        }

        console.log(">>>> Activation successful for:", subscriptionId);

        return res.status(200).json({
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

// Get a subscription by ID
subscriptionRouter.get('/:subscriptionId', async (req: Request, res: Response) => {
    try {
        const { subscriptionId } = req.params;
        const subscription = await Subscription.findById(subscriptionId).populate('planId');

        if (!subscription) {
            res.status(404).json({
                success: false,
                error: { message: 'Subscription not found' },
                data: null
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: { object: subscription, message: 'Subscription retrieved successfully' },
            error: null
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            success: false,
            error: { message: 'Error retrieving subscription: ' + errorMessage },
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
        // but let's notify them. Non-blocking to prevent failures if notification service is slow
        NotificationService.sendMultiChannelNotification(
            user._id.toString(),
            user.email,
            `Your subscription has been cancelled. You will revert to the Starter plan.`,
            'Subscription Cancelled',
            NotificationType.PLAN_CHANGE
        ).catch(err => console.error("Downgrade Notification failed:", err));

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

// Get payment methods for a user
subscriptionRouter.get('/:email/payments', async (req: Request, res: Response) => {
    try {
        const { email } = req.params;

        const user = await User.findOne({ email });
        if (!user) {
            res.status(404).json({
                success: false,
                error: { message: 'User not found' },
                data: null
            });
            return;
        }

        const payments = await Payment.find({ userId: user._id }).sort({ isDefault: -1, createdAt: -1 });

        res.status(200).json({
            success: true,
            data: { object: payments },
            error: null
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            success: false,
            error: { message: 'Error fetching payment methods: ' + errorMessage },
            data: null
        });
    }
});

// Get billing history (invoices) for a user
subscriptionRouter.get('/:email/invoices', async (req: Request, res: Response) => {
    try {
        const { email } = req.params;
        const user = await User.findOne({ email });
        if (!user) {
            res.status(404).json({
                success: false,
                error: { message: 'User not found' },
                data: null
            });
            return;
        }

        const invoices = await Invoice.find({ userId: user._id })
            .populate('planId')
            .populate('paymentId')
            .sort({ billingDate: -1 });

        res.status(200).json({
            success: true,
            data: { object: invoices, message: 'Invoices retrieved successfully' },
            error: null
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            success: false,
            error: { message: 'Error retrieving invoices: ' + errorMessage },
            data: null
        });
    }
});

// Delete a payment method
subscriptionRouter.delete('/payments/:paymentId', async (req: Request, res: Response) => {
    try {
        const { paymentId } = req.params;
        
        // Check if this payment is used by an active subscription
        const activeSub = await Subscription.findOne({ 
            paymentId: paymentId as any, 
            status: SubscriptionStatus.ACTIVE 
        });

        if (activeSub) {
            res.status(400).json({
                success: false,
                error: { message: 'Cannot delete payment method used by an active subscription' },
                data: null
            });
            return;
        }

        const deletedPayment = await Payment.findByIdAndDelete(paymentId);

        if (!deletedPayment) {
            res.status(404).json({
                success: false,
                error: { message: 'Payment method not found' },
                data: null
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: { message: 'Payment method deleted successfully' },
            error: null
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            success: false,
            error: { message: 'Error deleting payment method: ' + errorMessage },
            data: null
        });
    }
});

export default subscriptionRouter;
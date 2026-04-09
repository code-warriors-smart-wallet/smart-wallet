import Plan from '../models/plan';
import Payment from '../models/payment';
import cron from 'node-cron';
import Subscription, { SubscriptionStatus } from '../models/subscription';
import { createNotification, NotificationType } from '../services/notification.service';

export const initSubscriptionJobs = () => {
    cron.schedule('0 0 * * *', async () => {
        try {
            const subscriptions = await Subscription.find({
                status: SubscriptionStatus.ACTIVE,
                autoRenew: true,
                nextBillingDate: {
                    $lte: new Date(Date.now() + 24 * 60 * 60 * 1000) // Next 24 hours
                }
            });

            for (const subscription of subscriptions) {
                const result = await processSubscriptionRenewal(subscription);
                if (!result.success) {
                    // Send notification to user about failed renewal
                    console.log(`Subscription.Job ==> Failed to renew subscription ${subscription._id}: ${result.message}`);
                    
                    await createNotification({
                        userId: subscription.userId.toString(),
                        title: 'Subscription Expired',
                        type: NotificationType.SUBSCRIPTION_EXPIRED,
                        message: `Your subscription for plan "${result.planName || 'Current Plan'}" has expired. Reason: ${result.message}.`,
                        actionUrl: '/settings/subscription'
                    });
                }
            }
        } catch (error) {
            console.error('Subscription.Job ==> Error in subscription renewal job:', error);
        }
    });

    // Job to notify users about upcoming expiration (7 days before)
    cron.schedule('0 9 * * *', async () => {
        try {
            const nextWeek = new Date();
            nextWeek.setDate(nextWeek.getDate() + 7);
            const nextWeekStr = nextWeek.toISOString().split('T')[0];

            const expiringSoon = await Subscription.find({
                status: SubscriptionStatus.ACTIVE,
                endDate: {
                    $gte: new Date(nextWeekStr + 'T00:00:00.000Z'),
                    $lt: new Date(nextWeekStr + 'T23:59:59.999Z')
                }
            });

            for (const subscription of expiringSoon) {
                await createNotification({
                    userId: subscription.userId.toString(),
                    title: 'Subscription Reminder',
                    type: NotificationType.SUBSCRIPTION_EXPIRING_7D,
                    message: `Your subscription will expire in 7 days on ${nextWeekStr}. Please ensure your payment method is up to date.`,
                    actionUrl: '/settings/subscription'
                });
            }
        } catch (error) {
            console.error('Subscription.Job ==> Error in expiring soon job:', error);
        }
    });
};


const processSubscriptionRenewal = async (subscription: any) => {
    try {
        // Validate payment method
        const payment = await Payment.findById(subscription.paymentId);
        if (!payment || !payment.isValid) {
            await Subscription.findByIdAndUpdate(subscription._id, {
                status: SubscriptionStatus.EXPIRED,
                autoRenew: false
            });
            return {
                success: false,
                message: 'Payment method invalid or expired',
                planName: 'Current Plan'
            };
        }

        // Get plan details
        const plan = await Plan.findById(subscription.planId);
        if (!plan || !plan.active) {
            await Subscription.findByIdAndUpdate(subscription._id, {
                status: SubscriptionStatus.EXPIRED,
                autoRenew: false
            });
            return {
                success: false,
                message: 'Plan no longer active',
                planName: plan?.name || 'Current Plan'
            };
        }

        // Calculate new dates
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1);

        // Process payment here (integrate with payment gateway)
        // const paymentResult = await processPayment(payment, plan.price);

        // Update subscription
        await Subscription.findByIdAndUpdate(subscription._id, {
            startDate,
            endDate,
            lastBillingDate: startDate,
            nextBillingDate: endDate,
            status: SubscriptionStatus.ACTIVE
        });

        return {
            success: true,
            message: 'Subscription renewed successfully'
        };
    } catch (error) {
        console.error('Error renewing subscription:', error);
        return {
            success: false,
            message: 'Error processing renewal'
        };
    }
};


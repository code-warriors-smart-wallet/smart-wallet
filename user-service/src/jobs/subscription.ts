import Plan, { PlanType } from '../models/plan';
import Payment from '../models/payment';
import cron from 'node-cron';
import Subscription, { SubscriptionStatus } from '../models/subscription';
import User from '../models/user';
import { NotificationService, NotificationType } from '../services/notification.service';

/**
 * Initialize subscription-related cron jobs
 * - Runs every day at midnight (0 0 * * *)
 */
export const initSubscriptionJobs = () => {
    cron.schedule('0 0 * * *', async () => {
        console.log('Subscription.Job ==> Running daily subscription maintenance job');
        try {
            await handleSubscriptionReminders();
            await handleSubscriptionDowngrades();
            await handleAutoRenewals();
        } catch (error) {
            console.error('Subscription.Job ==> Error in subscription maintenance job:', error);
        }
    });
};

/**
 * Sends reminders to users whose subscription expires in 3 days
 */
const handleSubscriptionReminders = async () => {
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    threeDaysFromNow.setUTCHours(0, 0, 0, 0);

    const nextDay = new Date(threeDaysFromNow);
    nextDay.setDate(nextDay.getDate() + 1);

    const subscriptions = await Subscription.find({
        status: SubscriptionStatus.ACTIVE,
        endDate: { $gte: threeDaysFromNow, $lt: nextDay }
    }).populate('userId');

    for (const sub of subscriptions) {
        const user = sub.userId as any;
        if (user && user.email) {
            console.log(`Subscription.Job ==> Sending 3-day reminder to ${user.email}`);
            await NotificationService.sendMultiChannelNotification(
                user._id.toString(),
                user.email,
                `Your subscription will expire in 3 days. Please renew to keep your premium features.`,
                'Subscription Expiry Reminder',
                NotificationType.PAYMENT_REMINDER
            );
        }
    }
};

/**
 * Downgrades users to STARTER if their subscription expired more than 24 hours ago
 */
const handleSubscriptionDowngrades = async () => {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    oneDayAgo.setUTCHours(0, 0, 0, 0);

    // Find active subscriptions that should have been renewed/downgraded already
    // but are still marked active and past their 24h grace period.
    const expiredSubscriptions = await Subscription.find({
        status: SubscriptionStatus.ACTIVE,
        endDate: { $lt: oneDayAgo }
    }).populate('userId');

    const starterPlan = await Plan.findOne({ name: PlanType.STARTER });
    if (!starterPlan) return;

    for (const sub of expiredSubscriptions) {
        const user = sub.userId as any;
        if (user) {
            console.log(`Subscription.Job ==> Auto-downgrading user ${user.email} due to expired subscription`);
            
            // 1. Update subscription status
            await Subscription.findByIdAndUpdate(sub._id, {
                status: SubscriptionStatus.EXPIRED,
                autoRenew: false
            });

            // 2. Create new STARTER subscription for the user
            await Subscription.create({
                userId: user._id,
                planId: starterPlan._id,
                startDate: new Date(),
                endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 100)), // Lifetime for starter
                lastBillingDate: new Date(),
                nextBillingDate: new Date(new Date().setFullYear(new Date().getFullYear() + 100)),
                status: SubscriptionStatus.ACTIVE,
                autoRenew: false
            });

            // 3. Notify user
            await NotificationService.sendMultiChannelNotification(
                user._id.toString(),
                user.email,
                `Your premium subscription has expired. You have been moved to the Starter plan.`,
                'Subscription Downgraded',
                NotificationType.PLAN_CHANGE
            );
        }
    }
};

const handleAutoRenewals = async () => {
    const subscriptions = await Subscription.find({
        status: SubscriptionStatus.ACTIVE,
        autoRenew: true,
        nextBillingDate: {
            $lte: new Date()
        }
    });

    for (const subscription of subscriptions) {
        const result = await processSubscriptionRenewal(subscription);
        if (!result.success) {
            console.log(`Subscription.Job ==> Failed to auto-renew subscription ${subscription._id}: ${result.message}`);
        }
    }
};

const processSubscriptionRenewal = async (subscription: any) => {
    try {
        const payment = await Payment.findById(subscription.paymentId);
        if (!payment || !payment.isValid) {
            return { success: false, message: 'Payment method invalid' };
        }

        const plan = await Plan.findById(subscription.planId);
        if (!plan || !plan.active) {
            return { success: false, message: 'Plan no longer active' };
        }

        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1);

        await Subscription.findByIdAndUpdate(subscription._id, {
            startDate,
            endDate,
            lastBillingDate: startDate,
            nextBillingDate: endDate,
            status: SubscriptionStatus.ACTIVE
        });

        return { success: true, message: 'Renewed' };
    } catch (error) {
        return { success: false, message: 'Renewal error' };
    }
};


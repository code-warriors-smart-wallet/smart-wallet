import { api } from '../config/api';
import User from '../models/user';
import { getUserNotificationPreferences } from './notification-preference.service';

export enum NotificationType {
   REGISTRATION_SUCCESS = 'REGISTRATION_SUCCESS',
   SPACE_INVITATION_ACCEPTED = 'SPACE_INVITATION_ACCEPTED',
   SPACE_INVITATION_REJECTED = 'SPACE_INVITATION_REJECTED',
   USER_REMOVED_FROM_SPACE = 'USER_REMOVED_FROM_SPACE',
   USER_LEFT_SPACE = 'USER_LEFT_SPACE',
   DAILY_TRANSACTION_REMINDER = 'DAILY_TRANSACTION_REMINDER',
   SCHEDULE_DUE_REMINDER = 'SCHEDULE_DUE_REMINDER',
   SCHEDULE_OVERDUE_REMINDER = 'SCHEDULE_OVERDUE_REMINDER',
   SCHEDULE_ADDED_TO_TRANSACTION = 'SCHEDULE_ADDED_TO_TRANSACTION',
   BUDGET_75_WARNING = 'BUDGET_75_WARNING',
   BUDGET_90_WARNING = 'BUDGET_90_WARNING',
   BUDGET_CRITICAL = 'BUDGET_CRITICAL',
   LOAN_REPAYMENT_7D = 'LOAN_REPAYMENT_7D',
   LOAN_REPAYMENT_1D = 'LOAN_REPAYMENT_1D',
   LOAN_OVERDUE = 'LOAN_OVERDUE',
   CC_STATEMENT_7D = 'CC_STATEMENT_7D',
   CC_STATEMENT_1D = 'CC_STATEMENT_1D',
   CC_STATEMENT_OVERDUE = 'CC_STATEMENT_OVERDUE',
   CC_DUE_7D = 'CC_DUE_7D',
   CC_DUE_1D = 'CC_DUE_1D',
   CC_DUE_OVERDUE = 'CC_DUE_OVERDUE',
   SAVING_GOAL_25 = 'SAVING_GOAL_25',
   SAVING_GOAL_50 = 'SAVING_GOAL_50',
   SAVING_GOAL_75 = 'SAVING_GOAL_75',
   SAVING_GOAL_100 = 'SAVING_GOAL_100',
   SAVING_GOAL_DEADLINE_7D = 'SAVING_GOAL_DEADLINE_7D',
   SAVING_GOAL_DEADLINE_2D = 'SAVING_GOAL_DEADLINE_2D',
   SAVING_GOAL_DEADLINE_PASSED = 'SAVING_GOAL_DEADLINE_PASSED',
   MONTHLY_SUMMARY = 'MONTHLY_SUMMARY',
   WEEKLY_SUMMARY = 'WEEKLY_SUMMARY',
   DAILY_SUMMARY = 'DAILY_SUMMARY',
   SUBSCRIPTION_EXPIRING_7D = 'SUBSCRIPTION_EXPIRING_7D',
   SUBSCRIPTION_EXPIRED = 'SUBSCRIPTION_EXPIRED',
   PLAN_UPGRADE_SUCCESS = 'PLAN_UPGRADE_SUCCESS',
   PLAN_UPGRADE_FAIL = 'PLAN_UPGRADE_FAIL'
}

export interface CreateNotificationRequest {
   userId: string;
   spaceId?: string;
   title: string;
   type: NotificationType;
   message: string;
   actionUrl?: string;
}

export async function createNotification(notification: CreateNotificationRequest): Promise<boolean> {
    try {
        // 1. Fetch user email (needed for dispatcher)
        const user = await User.findById(notification.userId);
        if (!user) throw new Error('User not found');

        // 2. Fetch user notification preferences
        const preferences = await getUserNotificationPreferences(notification.userId);

        // 3. Call notification service with extra context
        console.log(`[USER-SERVICE] Calling notification-service for ${notification.type} to user ${notification.userId}`);
        const response = await api.post(`notification/create`, {
            ...notification,
            userEmail: user.email,
            userPreferences: preferences
        });

        return response.data.success;
    } catch (error) {
        console.error('Error creating notification:', error);
        return false;
    }
}

export async function createWelcomeNotification(userId: string, username: string): Promise<boolean> {
    return createNotification({
        userId,
        title: 'Welcome to Smart Wallet!',
        type: NotificationType.REGISTRATION_SUCCESS,
        message: `Hi ${username}, we are excited to have you on board! Start tracking your finances today. \n\nNext steps: \n1. Check your default "Cash in Hand" space \n2. Add your first income or expense transaction \n3. Set up a monthly budget to stay on track`,
        actionUrl: '/dashboard'
    });
}

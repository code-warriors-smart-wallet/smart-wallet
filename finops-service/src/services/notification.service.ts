import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:8083';

export enum NotificationType {
    BUDGET_75_WARNING = 'BUDGET_75_WARNING',
    BUDGET_90_WARNING = 'BUDGET_90_WARNING',
    BUDGET_CRITICAL = 'BUDGET_CRITICAL',
    SCHEDULE_ADDED_TO_TRANSACTION = 'SCHEDULE_ADDED_TO_TRANSACTION',
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
    DAILY_TRANSACTION_REMINDER = 'DAILY_TRANSACTION_REMINDER',
    SCHEDULE_DUE_REMINDER = 'SCHEDULE_DUE_REMINDER',
    SCHEDULE_OVERDUE_REMINDER = 'SCHEDULE_OVERDUE_REMINDER',
    DAILY_SUMMARY = 'DAILY_SUMMARY',
    WEEKLY_SUMMARY = 'WEEKLY_SUMMARY',
    MONTHLY_SUMMARY = 'MONTHLY_SUMMARY',
}

export interface CreateNotificationParams {
    userId: string;
    title: string;
    type: string;
    message: string;
    spaceId?: string;
    actionUrl?: string;
    userEmail?: string;
}

export async function createNotification(params: CreateNotificationParams) {
    try {
        console.log(`[FINOPS-SERVICE] Triggering ${params.type} for user ${params.userId} via ${NOTIFICATION_SERVICE_URL}`);
        const response = await axios.post(`${NOTIFICATION_SERVICE_URL}/create`, params);
        console.log(`[FINOPS-SERVICE] Notification response:`, response.data);
        return response.data;
    } catch (error: any) {
        const errorMsg = error.response ? JSON.stringify(error.response.data) : error.message;
        console.error(`[FINOPS-SERVICE] Failed to trigger notification: ${errorMsg}`);
        return null;
    }
}

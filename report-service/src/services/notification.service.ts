import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:8083';

export enum NotificationType {
    DAILY_SUMMARY = 'DAILY_SUMMARY',
    WEEKLY_SUMMARY = 'WEEKLY_SUMMARY',
    MONTHLY_SUMMARY = 'MONTHLY_SUMMARY',
}

export interface CreateNotificationParams {
    userId: string;
    title: string;
    type: string;
    message: string;
}

export async function createNotification(params: CreateNotificationParams) {
    try {
        const response = await axios.post(`${NOTIFICATION_SERVICE_URL}/notification/create`, {
            ...params,
            actionUrl: '/reports/dashboard'
        });
        return response.data;
    } catch (error) {
        console.error('Error triggering notification from report-service:', error);
        return null;
    }
}

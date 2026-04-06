import { api } from '../config/api';

export enum NotificationType {
    INFO = 'INFO',
    ALERT = 'ALERT',
    PLAN_CHANGE = 'PLAN_CHANGE',
    PAYMENT_REMINDER = 'PAYMENT_REMINDER'
}

export interface SendEmailOptions {
    to: string;
    subject: string;
    text: string;
}

export class NotificationService {
    /**
     * Send an in-app notification
     */
    static async sendInAppNotification(userId: string, message: string, type: NotificationType = NotificationType.INFO) {
        try {
            const response = await api.post('notification/notification', {
                userId,
                message,
                type
            });
            return response.data;
        } catch (error) {
            console.error('Error sending in-app notification:', error);
            return null;
        }
    }

    /**
     * Send an email notification
     */
    static async sendEmailNotification(userId: string, emailOptions: SendEmailOptions, type: string) {
        try {
            const mailReq = {
                mailOptions: emailOptions,
                userId: userId,
                type: type
            };
            const response = await api.post('notification/email/send/', mailReq);
            return response.data;
        } catch (error) {
            console.error('Error sending email notification:', error);
            return null;
        }
    }

    /**
     * Send both in-app and email notifications
     */
    static async sendMultiChannelNotification(userId: string, userEmail: string, message: string, subject: string, type: NotificationType) {
        // Run in parallel
        return Promise.all([
            this.sendInAppNotification(userId, message, type),
            this.sendEmailNotification(userId, { to: userEmail, subject, text: message }, type)
        ]);
    }
}

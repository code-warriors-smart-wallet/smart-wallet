import { api } from "../config/api.config";

export interface INotification {
    _id: string;
    userId: string;
    message: string;
    type: 'INFO' | 'ALERT' | 'PLAN_CHANGE' | 'PAYMENT_REMINDER';
    isRead: boolean;
    createdAt: string;
}

export interface NotificationResponse {
    success: boolean;
    data: {
        notifications: INotification[];
        total: number;
        unreadCount: number;
    };
}

export class NotificationService {
    static async getNotifications(userId: string, limit = 20, skip = 0): Promise<NotificationResponse> {
        const response = await api.get(`notification/notification/${userId}?limit=${limit}&skip=${skip}`);
        return response.data;
    }

    static async markAsRead(notificationId: string): Promise<{ success: boolean }> {
        const response = await api.patch(`notification/notification/${notificationId}/read`);
        return response.data;
    }

    static async markAllAsRead(userId: string): Promise<{ success: boolean }> {
        const response = await api.patch(`notification/notification/user/${userId}/read-all`);
        return response.data;
    }
}

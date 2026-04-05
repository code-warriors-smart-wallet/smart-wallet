import Notification, { NotificationType } from '../models/notification';
import EmailHistory, { EmailNotificationType } from '../models/email_history';
import { sendEmail } from './email.service';
import { NOTIFICATION_RULES } from '../config/notification-rules';
import { DispatchNotificationRequest, NotificationPreference } from '../interfaces/requests';

export async function dispatchNotification(request: DispatchNotificationRequest): Promise<{ inAppSent: boolean; emailSent: boolean }> {
    const { userId, userEmail, type, title, message, spaceId, actionUrl, userPreferences } = request;
    
    // 1. Get user preference for this action (if exists)
    const userPref = userPreferences?.find(p => p.action === type);
    
    // 2. Fallback to default rules
    const defaultRule = NOTIFICATION_RULES[type] || { inApp: false, email: false };
    
    const shouldSendInApp = userPref ? userPref.inAppEnabled : defaultRule.inApp;
    const shouldSendEmail = userPref ? userPref.emailEnabled : defaultRule.email;
    
    let inAppSent = false;
    let emailSent = false;

    // 3. Handle In-App
    if (shouldSendInApp) {
        try {
            await Notification.create({
                userId,
                spaceId,
                title,
                type: type as any,
                message,
                actionUrl,
                isRead: false
            });
            console.log(`[NOTIFICATION-SERVICE] In-app notification created for user ${userId}`);
            inAppSent = true;
        } catch (error) {
            console.error(`Failed to create in-app notification for ${userId}:`, error);
        }
    }

    // 4. Handle Email
    if (shouldSendEmail && userEmail) {
        try {
            const emailResult = await sendEmail({
                to: userEmail,
                subject: title,
                text: message
            });
            
            if (emailResult) {
                await EmailHistory.create({
                    userId,
                    to: userEmail,
                    subject: title,
                    text: message,
                    type: type as any
                });
                console.log(`[NOTIFICATION-SERVICE] Email sent & recorded for user ${userId} to ${userEmail}`);
                emailSent = true;
            }
        } catch (error) {
            console.error(`Failed to send email notification for ${userId}:`, error);
        }
    }

    return { inAppSent, emailSent };
}

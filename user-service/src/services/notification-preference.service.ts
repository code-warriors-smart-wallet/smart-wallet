import NotificationPreference from '../models/notification-preference';
import { NOTIFICATION_DEFAULTS } from '../config/notification-rules';

/**
 * Initializes default notification preferences for a new user.
 * Based on the prescribed guideline table.
 */
export async function initializeUserNotificationPreferences(userId: any): Promise<void> {
    try {
        const preferences = NOTIFICATION_DEFAULTS.map(perf => ({
            userId,
            action: perf.action,
            inAppEnabled: perf.inAppEnabled,
            emailEnabled: perf.emailEnabled
        }));

        // Use insertMany for efficiency
        await NotificationPreference.insertMany(preferences);
    } catch (error) {
        console.error(`Failed to initialize notification preferences for user ${userId}:`, error);
        // We don't throw here to avoid blocking registration, 
        // but in a production app you might want to retry or queue this.
    }
}

/**
 * Fetches notification preferences for a user.
 */
export async function getUserNotificationPreferences(userId: string) {
    return await NotificationPreference.find({ userId });
}

/**
 * Updates a specific notification preference.
 */
export async function updateNotificationPreference(userId: string, action: string, inAppEnabled: boolean, emailEnabled: boolean) {
    return await NotificationPreference.findOneAndUpdate(
        { userId, action },
        { inAppEnabled, emailEnabled },
        { new: true, upsert: true }
    );
}

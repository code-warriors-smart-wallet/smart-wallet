export interface MailOptions {
    to: string,
    subject: string,
    text: string
}

export interface MailRequest {
   userId: string;
   mailOptions: MailOptions;
   type: string;
}

export interface NotificationPreference {
    action: string;
    inAppEnabled: boolean;
    emailEnabled: boolean;
}

export interface DispatchNotificationRequest {
    userId: string;
    userEmail: string;
    type: string;
    title: string;
    message: string;
    spaceId?: string;
    actionUrl?: string;
    userPreferences?: NotificationPreference[]; // Optional override from caller
}

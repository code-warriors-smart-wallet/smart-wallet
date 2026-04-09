import { NotificationType } from '../models/notification';

export interface NotificationRule {
    inApp: boolean;
    email: boolean;
}

export const NOTIFICATION_RULES: Record<string, NotificationRule> = {
    [NotificationType.REGISTRATION_SUCCESS]: { inApp: true, email: true },
    [NotificationType.SPACE_INVITATION_ACCEPTED]: { inApp: true, email: false },
    [NotificationType.SPACE_INVITATION_REJECTED]: { inApp: true, email: false },
    [NotificationType.USER_REMOVED_FROM_SPACE]: { inApp: true, email: false },
    [NotificationType.USER_LEFT_SPACE]: { inApp: true, email: false },
    [NotificationType.DAILY_TRANSACTION_REMINDER]: { inApp: true, email: true },
    [NotificationType.SCHEDULE_DUE_REMINDER]: { inApp: true, email: true },
    [NotificationType.SCHEDULE_OVERDUE_REMINDER]: { inApp: true, email: true },
    [NotificationType.SCHEDULE_ADDED_TO_TRANSACTION]: { inApp: true, email: false },
    [NotificationType.BUDGET_75_WARNING]: { inApp: true, email: false },
    [NotificationType.BUDGET_90_WARNING]: { inApp: true, email: true },
    [NotificationType.BUDGET_CRITICAL]: { inApp: true, email: true },
    [NotificationType.LOAN_REPAYMENT_7D]: { inApp: true, email: false },
    [NotificationType.LOAN_REPAYMENT_1D]: { inApp: true, email: true },
    [NotificationType.LOAN_OVERDUE]: { inApp: true, email: true },
    [NotificationType.CC_STATEMENT_7D]: { inApp: true, email: false },
    [NotificationType.CC_STATEMENT_1D]: { inApp: true, email: true },
    [NotificationType.CC_STATEMENT_OVERDUE]: { inApp: true, email: true },
    [NotificationType.CC_DUE_7D]: { inApp: true, email: false },
    [NotificationType.CC_DUE_1D]: { inApp: true, email: true },
    [NotificationType.CC_DUE_OVERDUE]: { inApp: true, email: true },
    [NotificationType.SAVING_GOAL_25]: { inApp: true, email: false },
    [NotificationType.SAVING_GOAL_50]: { inApp: true, email: true },
    [NotificationType.SAVING_GOAL_75]: { inApp: true, email: true },
    [NotificationType.SAVING_GOAL_100]: { inApp: true, email: true },
    [NotificationType.SAVING_GOAL_DEADLINE_7D]: { inApp: true, email: false },
    [NotificationType.SAVING_GOAL_DEADLINE_2D]: { inApp: true, email: true },
    [NotificationType.SAVING_GOAL_DEADLINE_PASSED]: { inApp: true, email: true },
    [NotificationType.MONTHLY_SUMMARY]: { inApp: false, email: true },
    [NotificationType.WEEKLY_SUMMARY]: { inApp: false, email: true },
    [NotificationType.DAILY_SUMMARY]: { inApp: true, email: true },
    [NotificationType.SUBSCRIPTION_EXPIRING_7D]: { inApp: true, email: true },
    [NotificationType.SUBSCRIPTION_EXPIRED]: { inApp: true, email: true },
    [NotificationType.PLAN_UPGRADE_SUCCESS]: { inApp: true, email: true },
    [NotificationType.PLAN_UPGRADE_FAIL]: { inApp: true, email: true },
};

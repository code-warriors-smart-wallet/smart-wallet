import { Schema, Document, model } from 'mongoose';

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

export interface INotification extends Document {
   userId: Schema.Types.ObjectId;
   spaceId?: Schema.Types.ObjectId;
   title: string;
   type: NotificationType;
   message: string;
   isRead: boolean;
   actionUrl?: string;
   createdAt: Date;
   updatedAt: Date;
}

const NotificationSchema: Schema = new Schema({
   userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
   spaceId: { type: Schema.Types.ObjectId, ref: 'Space', required: false },
   title: { type: String, required: true },
   type: {
      type: String,
      enum: Object.values(NotificationType),
      required: true
   },
   message: { type: String, required: true },
   isRead: { type: Boolean, default: false },
   actionUrl: { type: String, required: false },
}, {
   timestamps: true
});

export default model<INotification>('Notification', NotificationSchema);

import { Schema, Document, model } from 'mongoose';

export enum EmailNotificationType {
   REGISTER_OTP_SEND = 'REGISTER_OTP_SEND',
   FORGOT_PASSWORD_OTP_SEND = 'FORGOT_PASSWORD_OTP_SEND',
   REGISTRATION_SUCCESS = 'REGISTRATION_SUCCESS',
   DAILY_TRANSACTION_REMINDER = 'DAILY_TRANSACTION_REMINDER',
   SCHEDULE_DUE_REMINDER = 'SCHEDULE_DUE_REMINDER',
   SCHEDULE_OVERDUE_REMINDER = 'SCHEDULE_OVERDUE_REMINDER',
   BUDGET_90_WARNING = 'BUDGET_90_WARNING',
   BUDGET_CRITICAL = 'BUDGET_CRITICAL',
   LOAN_REPAYMENT_1D = 'LOAN_REPAYMENT_1D',
   LOAN_OVERDUE = 'LOAN_OVERDUE',
   CC_STATEMENT_1D = 'CC_STATEMENT_1D',
   CC_STATEMENT_OVERDUE = 'CC_STATEMENT_OVERDUE',
   CC_DUE_1D = 'CC_DUE_1D',
   CC_DUE_OVERDUE = 'CC_DUE_OVERDUE',
   SAVING_GOAL_100 = 'SAVING_GOAL_100',
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

export interface IEmailHistory extends Document {
   userId: Schema.Types.ObjectId;
   to: string;
   subject: string;
   text: string,
   type: EmailNotificationType,
}

const EmailHistorySchema: Schema = new Schema({
   userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
   type: {
      type: String,
      enum: Object.values(EmailNotificationType),
   },
   to: { type: String },
   subject: { type: String },
   text: { type: String },
}, {
   timestamps: true
});

export default model<IEmailHistory>('EmailHistory', EmailHistorySchema);

import { Schema, Document, model } from 'mongoose';

export enum EmailNotificationType {
   REGISTER_OTP_SEND = 'REGISTER_OTP_SEND',
   FORGOT_PASSWORD_OTP_SEND = 'FORGOT_PASSWORD_OTP_SEND',
   NEW_USER_WELCOME_SEND = 'NEW_USER_WELCOME_SEND',
   SPACE_INVITATION_SEND = 'SPACE_INVITATION_SEND'
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

import { Schema, Document, model } from 'mongoose';

export enum NotificationType {
   INFO = 'INFO',
   ALERT = 'ALERT',
   PLAN_CHANGE = 'PLAN_CHANGE',
   PAYMENT_REMINDER = 'PAYMENT_REMINDER'
}

export interface INotification extends Document {
   userId: Schema.Types.ObjectId;
   message: string;
   type: NotificationType;
   isRead: boolean;
   createdAt: Date;
   updatedAt: Date;
}

const NotificationSchema: Schema = new Schema({
   userId: { type: Schema.Types.ObjectId, required: true },
   message: { type: String, required: true },
   type: {
      type: String,
      enum: Object.values(NotificationType),
      default: NotificationType.INFO
   },
   isRead: { type: Boolean, default: false }
}, {
   timestamps: true
});

// Index for faster queries by user
NotificationSchema.index({ userId: 1, createdAt: -1 });

export default model<INotification>('Notification', NotificationSchema);

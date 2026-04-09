import { Schema, Document, model } from 'mongoose';

export interface INotificationPreference extends Document {
   userId: Schema.Types.ObjectId;
   action: string;
   inAppEnabled: boolean;
   emailEnabled: boolean;
}

const NotificationPreferenceSchema: Schema = new Schema({
   userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
   action: { type: String, required: true },
   inAppEnabled: { type: Boolean, default: true },
   emailEnabled: { type: Boolean, default: true },
}, {
   timestamps: true
});

// Ensure unique preference per user per action
NotificationPreferenceSchema.index({ userId: 1, action: 1 }, { unique: true });

export default model<INotificationPreference>('NotificationPreference', NotificationPreferenceSchema);

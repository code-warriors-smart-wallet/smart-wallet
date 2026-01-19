import mongoose, { Schema, Document } from 'mongoose';

export enum SubscriptionStatus {
    ACTIVE = 'ACTIVE',
    EXPIRED = 'EXPIRED',
    CANCELLED = 'CANCELLED',
    PENDING = 'PENDING'
}

export interface ISubscription extends Document {
    userId: mongoose.Types.ObjectId;
    planId: mongoose.Types.ObjectId;
    startDate: Date;
    endDate: Date;
    status: SubscriptionStatus;
    autoRenew: boolean;
    paymentId: mongoose.Types.ObjectId;
    cancelledAt?: Date;
    lastBillingDate: Date;
    nextBillingDate: Date;
}

const SubscriptionSchema: Schema = new Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    planId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { 
        type: String, 
        enum: Object.values(SubscriptionStatus), 
        default: SubscriptionStatus.PENDING 
    },
    autoRenew: { type: Boolean, default: false },
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
    cancelledAt: { type: Date },
    lastBillingDate: { type: Date, required: true },
    nextBillingDate: { type: Date, required: true }
}, {
    timestamps: true
});

export default mongoose.model<ISubscription>('Subscription', SubscriptionSchema);

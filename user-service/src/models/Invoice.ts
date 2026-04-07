import mongoose, { Schema, Document } from 'mongoose';

export enum InvoiceStatus {
    PAID = 'PAID',
    FAILED = 'FAILED',
    PENDING = 'PENDING'
}

export interface IInvoice extends Document {
    userId: mongoose.Types.ObjectId;
    subscriptionId: mongoose.Types.ObjectId;
    planId: mongoose.Types.ObjectId;
    paymentId?: mongoose.Types.ObjectId;
    amount: number;
    currency: string;
    status: InvoiceStatus;
    billingDate: Date;
}

const InvoiceSchema: Schema = new Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription', required: true },
    planId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', required: true },
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'LKR' },
    status: { 
        type: String, 
        enum: Object.values(InvoiceStatus), 
        default: InvoiceStatus.PENDING 
    },
    billingDate: { type: Date, default: Date.now }
}, {
    timestamps: true
});

export default mongoose.model<IInvoice>('Invoice', InvoiceSchema);

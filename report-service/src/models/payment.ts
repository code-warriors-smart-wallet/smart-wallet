import mongoose, { Schema, Document } from 'mongoose';

export enum PaymentType {
    CREDIT_CARD = 'CREDIT_CARD',
    DEBIT_CARD = 'DEBIT_CARD',
    PAYPAL = 'PAYPAL'
}

export interface PaymentDetails {
    cardType?: string;
    lastFourDigits?: string;
    expiryDate?: string;
    paypalEmail?: string;
}

export interface IPayment extends Document {
    userId: mongoose.Types.ObjectId;
    type: PaymentType;
    details: PaymentDetails;
    isDefault: boolean;
    isValid: boolean;
    validUntil?: Date;
}

const PaymentSchema: Schema = new Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { 
        type: String, 
        enum: Object.values(PaymentType), 
        required: true 
    },
    details: {
        cardType: { type: String },
        lastFourDigits: { type: String },
        expiryDate: { type: String },
        paypalEmail: { type: String }
    },
    isDefault: { type: Boolean, default: false },
    isValid: { type: Boolean, default: true },
    validUntil: { type: Date }
}, {
    timestamps: true
});

// Ensure only one default payment method per user
PaymentSchema.index({ userId: 1, isDefault: 1 }, { 
    unique: true, 
    partialFilterExpression: { isDefault: true } 
});

export default mongoose.model<IPayment>('Payment', PaymentSchema);

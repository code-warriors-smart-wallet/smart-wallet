import mongoose, { Schema, Document } from 'mongoose';

export enum BillingCycle {
    MONTHLY = 'MONTHLY',
    YEARLY = 'YEARLY'
}

export enum PlanType {
    STARTER = "Starter",
    PLUS = "Plus",
    PRO = "Pro"
}

// {
//     name: "Starter"
//     price: 0
//     currency: "LKR"
//     description: "free version";
//     features: [];
//     active: true;
// },
// {
//     name: "Plus"
//     price: 49
//     currency: "LKR"
//     description: "paid version";
//     features: [];
//     active: true;
// },
// {
//     name: "Pro"
//     price: 99
//     currency: "LKR"
//     description: "paid version";
//     features: [];
//     active: true;
// }
export interface IPlan extends Document {
    _id: string;
    name: PlanType;
    description: string;
    monthly_price: number;
    yearly_price: number;
    currency: string;
    features: string[];
    active: boolean;
}

const PlanSchema: Schema = new Schema({
    name: { type: String, required: true },
    description: { type: String },
    monthly_price: { type: Number },
    yearly_price: { type: Number },
    currency: { type: String, default: 'USD' },
    features: [{ type: String }],
    active: { type: Boolean, default: true }
}, {
    timestamps: true
});

export default mongoose.model<IPlan>('Plan', PlanSchema);

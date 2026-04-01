import { Document, model, Schema } from "mongoose";

export enum InterestType {
    FLAT = "FLAT",
    REDUCING = "REDUCING",
    EMI = "EMI",
    INTEREST_ONLY = "INTEREST_ONLY"
}

export enum PaymentFrequency {
    WEEKLY = 0.25,
    BI_WEEKLY = 0.5,
    MONTHLY = 1,
    BI_MONTHLY = 2,
    QUARTERLY = 3,
    SEMI_ANNUALLY = 6,
    ANNUALLY = 12
}

export enum InstallmentStatus {
    PENDING = "PENDING",
    PARTIAL_PAID = "PARTIAL_PAID",
    PAID = "PAID",
    OVERDUE = "OVERDUE"
}

export interface ILoanRepaymentPlan extends Document {
    spaceId: Schema.Types.ObjectId;
    monthsPerInstallment: number;
    firstPaymentDate: Date;
    monthlyInterestRate: number;
    totalInterest: number;
    createdAt: Date;
    updatedAt: Date;
}

const LoanRepaymentPlanSchema: Schema = new Schema({
    spaceId: {
        type: Schema.Types.ObjectId,
        ref: "Space",
        required: true
    },
    monthsPerInstallment: {
        type: Number,
        required: true
    },
    firstPaymentDate: {
        type: Date,
        required: true
    },
    monthlyInterestRate: {
        type: Number,
        default: 0
    },
    totalInterest: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

export default model<ILoanRepaymentPlan>("LoanRepaymentPlan", LoanRepaymentPlanSchema);
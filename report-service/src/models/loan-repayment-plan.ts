import mongoose, { Schema, Document, Types, model } from "mongoose";

export interface ILoanRepaymentPlan extends Document {
    spaceId: Types.ObjectId;
    monthsPerInstallment: number;
    firstPaymentDate: Date;
    monthlyInterestRate: number;
    totalInterest: number;
    interestType: string;
    paymentFrequency: string;
    createdAt: Date;
    updatedAt: Date;
}

const LoanRepaymentPlanSchema = new Schema<ILoanRepaymentPlan>(
    {
        spaceId: {
            type: Schema.Types.ObjectId,
            ref: "Space",
            required: true,
        },
        monthsPerInstallment: {
            type: Number,
            required: true,
        },
        interestType: {
            type: String,
            required: true,
        },
        paymentFrequency: {
            type: String,
            required: true,
        },
        firstPaymentDate: {
            type: Date,
            required: true,
        },
        monthlyInterestRate: {
            type: Number,
            required: true,
        },
        totalInterest: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

export default model<ILoanRepaymentPlan>("LoanRepaymentPlan", LoanRepaymentPlanSchema)
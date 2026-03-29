import mongoose, { Schema, Document, Types, model } from "mongoose";

export enum InstallmentStatus {
    PENDING = "PENDING",
    PARTIAL = "PARTIAL",
    PAID = "PAID",
    OVERDUE = "OVERDUE",
}

export interface ILoanInstallment extends Document {

    installmentNumber: number;

    spaceId: Types.ObjectId;
    loanRepaymentPlanId: Types.ObjectId;

    startDate: Date;
    endDate: Date;

    principalAmount: number;
    interestAmount: number;
    penaltyAmount: number;

    principalPaid: number;
    interestPaid: number;
    penaltyPaid: number;

    totalPayment: number;
    remainingBalance: number;

    status: InstallmentStatus;

    createdAt: Date;
    updatedAt: Date;
}

const LoanInstallmentSchema = new Schema<ILoanInstallment>(
    {
        installmentNumber: {
            type: Number,
            required: true,
        },

        spaceId: { 
            type: Schema.Types.ObjectId,
            ref: "Space",
            required: true,
        },
        loanRepaymentPlanId: {
            type: Schema.Types.ObjectId,
            ref: "LoanRepaymentPlan",
            required: true,
        },

        startDate: {
            type: Date,
            required: true,
        },
        endDate: {
            type: Date,
            required: true,
        },

        principalAmount: {
            type: Number,
            required: true,
        },
        interestAmount: {
            type: Number,
            required: true,
        },
        penaltyAmount: {
            type: Number,
            default: 0,
        },

        principalPaid: {
            type: Number,
            default: 0,
        },
        interestPaid: {
            type: Number,
            default: 0,
        },
        penaltyPaid: {
            type: Number,
            default: 0,
        },

        totalPayment: {
            type: Number,
            default: 0,
        },

        remainingBalance: {
            type: Number,
            default: 0,
        },

        status: {
            type: String,
            enum: Object.values(InstallmentStatus),
            default: InstallmentStatus.PENDING,
        },
    },
    { timestamps: true }
);

export default model<ILoanInstallment>(
    "LoanInstallment",
    LoanInstallmentSchema
);
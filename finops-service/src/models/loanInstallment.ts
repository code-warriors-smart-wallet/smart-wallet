import { Document, model, Schema } from "mongoose";
import { InstallmentStatus } from "./loanRepaymentPlan";

export interface ILoanInstallment extends Document {
    spaceId: Schema.Types.ObjectId;
    loanRepaymentPlanId: Schema.Types.ObjectId;
    startDate: Date;
    endDate: Date;
    principalAmount: number;
    interestAmount: number;
    penaltyAmount: number;
    principalPaid: number;
    interestPaid: number;
    penaltyPaid: number;
    status: InstallmentStatus;
    createdAt: Date;
    updatedAt: Date;
}

const LoanInstallmentSchema: Schema = new Schema({
    spaceId: {
        type: Schema.Types.ObjectId,
        ref: "Space",
        required: true
    },
    loanRepaymentPlanId: {
        type: Schema.Types.ObjectId,
        ref: "LoanRepaymentPlan",
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    principalAmount: {
        type: Number,
        required: true
    },
    interestAmount: {
        type: Number,
        default: 0
    },
    penaltyAmount: {
        type: Number,
        default: 0
    },
    principalPaid: {
        type: Number,
        default: 0
    },
    interestPaid: {
        type: Number,
        default: 0
    },
    penaltyPaid: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ["PENDING", "PARTIAL_PAID", "PAID", "OVERDUE"],
        default: "PENDING"
    }
}, {
    timestamps: true
});

export default model<ILoanInstallment>("LoanInstallment", LoanInstallmentSchema);
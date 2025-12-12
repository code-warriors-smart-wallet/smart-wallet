import { Document, model, Schema } from "mongoose";

export enum TransactionType {
    EXPENSE = 'EXPENSE',
    INCOME = 'INCOME',
    INTERNAL_TRANSFER = 'INTERNAL_TRANSFER',
    LOAN_CHARGES = "LOAN_CHARGES",
    LOAN_PRINCIPAL = "LOAN_PRINCIPAL",
    BALANCE_INCREASE = "BALANCE_INCREASE",
    BALANCE_DECREASE = "BALANCE_DECREASE",
    REPAYMENT_PAID = "REPAYMENT_PAID",
    REPAYMENT_RECEIVED = "REPAYMENT_RECEIVED",
    SAVING = "SAVING",
    WITHDRAW = "WITHDRAW",
}

export interface ITransaction extends Document {
    type: TransactionType,
    amount: Schema.Types.Decimal128,
    from: Schema.Types.ObjectId,
    to: Schema.Types.ObjectId,
    date: Schema.Types.Date,
    note: string,
    pcategory: Schema.Types.ObjectId,
    scategory: Schema.Types.ObjectId,
    userId: Schema.Types.ObjectId,
    scheduleId: Schema.Types.ObjectId,
    spaceId: Schema.Types.ObjectId,
}

const TransactionSchema: Schema = new Schema({
    type: {
        type: String,
        enum: Object.values(TransactionType)
    },
    amount: {
        type: Schema.Types.Decimal128
    },
    from: {
        type: Schema.Types.ObjectId,
        ref: "Space"
    },
    to: {
        type: Schema.Types.ObjectId,
        ref: "Space"
    },
    date: {
        type: Schema.Types.Date
    },
    note: {
        type: String
    },
    pcategory: {
        type: Schema.Types.ObjectId,
        ref: "Category"
    },
    scategory: {
        type: Schema.Types.ObjectId,
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    scheduleId: {
        type: Schema.Types.ObjectId,
        ref: "Schedule"
    },
    spaceId: {
        type: Schema.Types.ObjectId,
        ref: "Space"
    }
})

export default model<ITransaction>("Transaction", TransactionSchema)
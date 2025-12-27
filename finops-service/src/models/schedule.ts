import { Document, model, Schema } from "mongoose";
import { MemberStatus, TransactionType } from "./transaction";

export enum Repeat {
    DAY = "DAY",
    WEEK = "WEEK",
    MONTH = "MONTH",
    YEAR = "YEAR",
}

export enum RecurringApproval {
    MANUAL = "MANUAL",
    AUTO = "AUTO",
}
export enum Frequency {
    ONE_TIME = "ONE_TIME",
    RECURRENT = "RECURRENT"
}
export interface ISchedule extends Document {
    type: TransactionType,
    amount: Schema.Types.Decimal128,
    from: Schema.Types.ObjectId,
    to: Schema.Types.ObjectId,
    note: string,
    pcategory: Schema.Types.ObjectId,
    scategory: Schema.Types.ObjectId,
    userId: Schema.Types.ObjectId,
    startDate: Date,
    endDate: Date,
    nextDueDate: Date,
    recurrent: boolean,
    repeat: Repeat,
    interval: number,
    isAutomated: boolean,
    isActive: boolean,
    spaceId: Schema.Types.ObjectId,
    memberStatus: string
}

const ScheduleSchema: Schema = new Schema({
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
    startDate: {
        type: Date
    },
    endDate: {
        type: Date
    },
    nextDueDate: {
        type: Date
    },
    recurrent: {
        type: Schema.Types.Boolean
    },
    repeat: {
        type: String,
        enum: Object.values(Repeat)
    },
    interval: {
        type: Number
    },
    isAutomated: {
        type: Schema.Types.Boolean
    },
    isActive: {
        type: Schema.Types.Boolean
    },
    spaceId: {
        type: Schema.Types.ObjectId,
        ref: "Space"
    },
    memberStatus: {
            type: String,
            enum: Object.values(MemberStatus),
            default: MemberStatus.ACTIVE_MEMBER
        },
})

export default model<ISchedule>("Schedule", ScheduleSchema)
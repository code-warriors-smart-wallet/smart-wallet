import { Schema, Document, model } from 'mongoose';

export interface ISchedule extends Document {
    userId: Schema.Types.ObjectId;
    spaceId: Schema.Types.ObjectId;
    amount: Schema.Types.Decimal128;
    type: string;
    note: string;
    frequency: string;
    nextDate: Date;
    pcategory: Schema.Types.ObjectId;
    scategory: Schema.Types.ObjectId;
}

const ScheduleSchema: Schema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    spaceId: { type: Schema.Types.ObjectId, ref: 'Space' },
    amount: { type: Schema.Types.Decimal128 },
    type: { type: String, enum: ['EXPENSE', 'INCOME'] },
    note: { type: String },
    frequency: { type: String, enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'] },
    nextDate: { type: Date },
    from: { type: Schema.Types.ObjectId, ref: 'Space' },
    to: { type: Schema.Types.ObjectId, ref: 'Space' },
    pcategory: { type: Schema.Types.ObjectId, ref: 'Category' },
    scategory: { type: Schema.Types.ObjectId },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default model<ISchedule>('Schedule', ScheduleSchema);

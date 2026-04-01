import mongoose, { Schema, Document } from 'mongoose';

export interface IBudgetEntry extends Document {
    budget_id: mongoose.Types.ObjectId;
    spaceId: mongoose.Types.ObjectId;
    start_date: Date;
    end_date: Date;
    amount: number;
    spent: number;
    createdAt: Date;
    updatedAt: Date;
}

const budgetEntrySchema: Schema = new Schema({
    budget_id: {
        type: Schema.Types.ObjectId,
        ref: 'Budget',
        required: true
    },
    spaceId: { 
        type: Schema.Types.ObjectId,
        ref: 'Space',
        required: true
    },
    start_date: {
        type: Date,
        required: true
    },
    end_date: {
        type: Date,
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    spent: {
        type: Number,
        default: 0,
        min: 0
    }
}, {
    timestamps: true
});

export default mongoose.model<IBudgetEntry>('BudgetEntry', budgetEntrySchema);
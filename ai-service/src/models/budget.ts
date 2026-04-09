import mongoose, { Schema, Document } from 'mongoose';

export interface IBudget extends Document {
    name: string;
    amount: number;
    type: string;
    mainCategoryId: mongoose.Types.ObjectId;
    subCategoryIds: mongoose.Types.ObjectId[];
    spaceIds: mongoose.Types.ObjectId[];
    spaceTypes: string[];
    startDate?: Date;
    endDate?: Date;
    userId: mongoose.Types.ObjectId;
    last_applied_date: Date;
    isMultiSpace: boolean;
}

const budgetSchema: Schema = new Schema({
    name: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    type: { type: String, required: true, enum: ['ONE_TIME', 'WEEKLY', 'MONTHLY'] },
    mainCategoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    subCategoryIds: [{ type: Schema.Types.ObjectId, ref: 'Category.subCategories' }],
    spaceIds: [{ type: Schema.Types.ObjectId, ref: 'Space', required: true }],
    spaceTypes: [{ type: String, required: true, enum: ['CASH', 'BANK', 'CREDIT_CARD'] }],
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    last_applied_date: { type: Date, required: true, default: Date.now },
    isMultiSpace: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model<IBudget>('Budget', budgetSchema);

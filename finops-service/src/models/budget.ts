import mongoose, { Schema, Document } from 'mongoose';

export interface IBudget extends Document {
    name: string;
    amount: number;
    type: string; // ONE_TIME, WEEKLY, MONTHLY
    mainCategoryId: mongoose.Types.ObjectId;
    subCategoryIds: mongoose.Types.ObjectId[];
    spaceId: mongoose.Types.ObjectId;
    spaceType: string;
    startDate?: Date;
    endDate?: Date;
    userId: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const budgetSchema: Schema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    type: {
        type: String,
        required: true,
        enum: ['ONE_TIME', 'WEEKLY', 'MONTHLY']
    },
    mainCategoryId: {
        type: Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    subCategoryIds: [{
        type: Schema.Types.ObjectId,
        ref: 'Category.subCategories'
    }],
    spaceId: {
        type: Schema.Types.ObjectId,
        ref: 'Space',
        required: true
    },
    spaceType: {
        type: String,
        required: true,
        enum: ['CASH', 'BANK', 'CREDIT_CARD']
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    endDate: {
        type: Date
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});


export default mongoose.model<IBudget>('Budget', budgetSchema);
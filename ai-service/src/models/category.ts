import { Schema, Document, model } from 'mongoose';

interface ISubCategory {
    _id?: Schema.Types.ObjectId;
    name: string;
}

export interface ICategory extends Document {
    name: string;
    userId: Schema.Types.ObjectId;
    type: string;
    subCategories: ISubCategory[];
}

const SubCategorySchema = new Schema<ISubCategory>({
    name: { type: String, required: true }
});

const CategorySchema: Schema = new Schema({
    name: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    type: { type: String, enum: ['EXPENSE', 'INCOME'] },
    subCategories: { type: [SubCategorySchema], default: [] }
}, { timestamps: true });

export default model<ICategory>('Category', CategorySchema);

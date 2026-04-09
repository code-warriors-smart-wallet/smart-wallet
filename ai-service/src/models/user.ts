import { Schema, Document, model } from 'mongoose';

export interface IUser extends Document {
    username: string;
    email: string;
    password: string;
    role: string;
    plan: string;
    currency: string;
    spaces: Schema.Types.ObjectId[];
}

const UserSchema: Schema = new Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'user' },
    plan: { type: String, default: 'free' },
    currency: { type: String, default: 'USD' },
    spaces: [{ type: Schema.Types.ObjectId, ref: 'Space' }]
}, { timestamps: true });

export default model<IUser>('User', UserSchema);

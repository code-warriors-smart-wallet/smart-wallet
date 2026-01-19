import mongoose, { Schema, Document } from 'mongoose';

export enum UserRole {
    ADMIN = 'ADMIN',
    USER = 'USER'
}

export interface IUser extends Document {
    username: string;
    email: string;
    password: string;
    profileImgUrl?: string;
    currency: string;
    enabled: boolean;
    role: UserRole;
    blockedUntil?: Date;
    refreshToken?:string
}

const UserSchema: Schema = new Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    profileImgUrl: { type: String },
    currency: { type: String, default: 'USD' },
    enabled: { type: Boolean, default: true },
    role: { type: String, enum: Object.values(UserRole), default: UserRole.USER },
    blockedUntil: { type: Date },
    refreshToken: { type: String },
}, {
    timestamps: true
});

// Helper methods
UserSchema.methods.isBlocked = function(): boolean {
    return this.blockedUntil && this.blockedUntil > new Date();
};

export default mongoose.model<IUser>('User', UserSchema);

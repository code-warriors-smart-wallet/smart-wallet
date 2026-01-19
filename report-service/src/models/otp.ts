import mongoose, { Schema, Document } from 'mongoose';

export interface IOTP extends Document {
    userId: mongoose.Types.ObjectId;
    code: string;
    description: string;
    expiredAt: Date;
    attempts: number;
    lastOtpAttemptAt?: Date;
}

const OTPSchema: Schema = new Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    code: { type: String, required: true },
    description: { type: String, required: true },
    expiredAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    lastOtpAttemptAt: { type: Date }
}, {
    timestamps: true
});

// Index to automatically expire documents
OTPSchema.index({ expiredAt: 1 }, { expireAfterSeconds: 0 });

// Helper methods
OTPSchema.methods.incrementAttempts = async function(): Promise<void> {
    this.attempts += 1;
    this.lastOtpAttemptAt = new Date();
    await this.save();
};

export default mongoose.model<IOTP>('OTP', OTPSchema);

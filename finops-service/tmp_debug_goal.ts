import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Specify the path to your .env file
dotenv.config({ path: 'd:/system design development/smart-wallet/finops-service/.env' });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/smart-wallet';

async function debugGoal() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const Space = mongoose.model('Space', new mongoose.Schema({}, { strict: false }));
        const Transaction = mongoose.model('Transaction', new mongoose.Schema({}, { strict: false }));

        const goal = (await Space.findOne({ name: 'Trip For Japan' })) as any;
        if (!goal) {
            console.log('Goal "Trip For Japan" not found');
            await mongoose.disconnect();
            return;
        }

        console.log('\n--- Goal Data ---');
        console.log('ID:', goal._id);
        console.log('Target:', goal.targetAmount?.toString());
        console.log('Last Threshold Notified:', goal.lastThresholdNotified);

        const transactions = await Transaction.find({
            $or: [
                { to: goal._id },
                { from: goal._id },
                { spaceId: goal._id }
            ]
        });

        console.log('\n--- Transactions Found ---');
        console.log('Count:', transactions.length);
        transactions.forEach((t: any) => {
            console.log(`Type: ${t.type}, Amount: ${t.amount}, To: ${t.to}, From: ${t.from}, spaceId: ${t.spaceId}`);
        });

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}

debugGoal();

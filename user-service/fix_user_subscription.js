const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const mongoUri = process.env.MONGODB_URI;

const SubscriptionSchema = new mongoose.Schema({}, { strict: false, collection: 'subscriptions' });
const UserSchema = new mongoose.Schema({}, { strict: false, collection: 'users' });
const PlanSchema = new mongoose.Schema({}, { strict: false, collection: 'plans' });
const InvoiceSchema = new mongoose.Schema({}, { strict: false, collection: 'invoices' });

const Subscription = mongoose.model('Subscription', SubscriptionSchema);
const User = mongoose.model('User', UserSchema);
const Plan = mongoose.model('Plan', PlanSchema);
const Invoice = mongoose.model('Invoice', InvoiceSchema);

async function fix() {
    try {
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        const userEmail = 'thirujawuthamy007@gmail.com';
        const user = await User.findOne({ email: userEmail });
        
        if (!user) {
            console.log('User not found:', userEmail);
            return;
        }

        const plusPlan = await Plan.findOne({ name: 'Plus' });
        if (!plusPlan) {
            console.log('Plus plan not found');
            return;
        }

        // Find the latest PENDING plus subscription
        const latestPending = await Subscription.findOne({ 
            userId: user._id, 
            planId: plusPlan._id,
            status: 'PENDING'
        }).sort({ createdAt: -1 });

        if (!latestPending) {
            console.log('No pending Plus subscription found to fix.');
            return;
        }

        console.log('Found latest pending subscription:', latestPending._id);

        // 1. Activate it
        await Subscription.findByIdAndUpdate(latestPending._id, {
            status: 'ACTIVE',
            paymentId: 'fix_manual_' + Date.now(),
            updatedAt: new Date()
        });
        console.log('Subscription activated.');

        // 2. Ensure all other subscriptions are CANCELLED
        await Subscription.updateMany(
            { userId: user._id, _id: { $ne: latestPending._id } },
            { status: 'CANCELLED', cancelledAt: new Date() }
        );
        console.log('Other subscriptions cancelled.');

        // 3. Create a missing Invoice record for billing history
        const invoiceCount = await Invoice.countDocuments({ subscriptionId: latestPending._id });
        if (invoiceCount === 0) {
            await Invoice.create({
                userId: user._id,
                subscriptionId: latestPending._id,
                planId: plusPlan._id,
                paymentId: 'fix_manual_' + Date.now(),
                amount: plusPlan.monthly_price || 1999,
                currency: plusPlan.currency || 'LKR',
                status: 'PAID',
                billingDate: new Date()
            });
            console.log('Missing invoice created.');
        } else {
            console.log('Invoice already exists.');
        }

        console.log('\nFIX COMPLETE. User should see PLUS plan on refresh.');

    } catch (err) {
        console.error('Error during fix:', err);
    } finally {
        await mongoose.disconnect();
    }
}

fix();

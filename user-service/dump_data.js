const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

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

async function dump() {
    let output = '';
    try {
        await mongoose.connect(mongoUri);
        output += 'Connected to MongoDB\n';

        const plusPlan = await Plan.findOne({ name: 'Plus' });
        const starterPlan = await Plan.findOne({ name: 'Starter' });

        if (!plusPlan) {
            output += 'Plus plan not found\n';
        } else {
            const recentPlusSubs = await Subscription.find({ planId: plusPlan._id }).sort({ createdAt: -1 }).limit(1);
            
            if (recentPlusSubs.length === 0) {
                output += 'No Plus subscriptions found\n';
            } else {
                const latestSub = recentPlusSubs[0];
                const userId = latestSub.userId;

                output += '\n=== USER INFO ===\n';
                const user = await User.findById(userId);
                output += JSON.stringify(user, null, 2) + '\n';

                output += '\n=== ALL SUBSCRIPTIONS FOR USER ===\n';
                const allSubs = await Subscription.find({ userId }).sort({ createdAt: -1 });
                output += JSON.stringify(allSubs, null, 2) + '\n';

                output += '\n=== ALL INVOICES FOR USER ===\n';
                const allInvoices = await Invoice.find({ userId }).sort({ createdAt: -1 });
                output += JSON.stringify(allInvoices, null, 2) + '\n';

                output += '\n=== PLANS ===\n';
                output += `Plus Plan ID: ${plusPlan._id}\n`;
                output += `Plus Plan Details: ${JSON.stringify(plusPlan, null, 2)}\n`;
                output += `Starter Plan ID: ${starterPlan?._id}\n`;
            }
        }
        fs.writeFileSync('dump_final.txt', output, 'utf8');
        console.log('Dump completed and saved to dump_final.txt');
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

dump();

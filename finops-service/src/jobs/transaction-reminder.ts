import cron from 'node-cron';
import User from '../models/user';
import Transaction from '../models/transaction';
import { createNotification, NotificationType } from '../services/notification.service';

export const initTransactionReminderJobs = () => {
    // Run daily at 8 PM (20:00)
    cron.schedule('0 20 * * *', async () => {
        try {
            console.log('TransactionReminder.Job ==> Checking for inactive users today.');
            
            const now = new Date();
            const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

            const users = await User.find({ enabled: true });

            for (const user of users) {
                const userAny = user as any;
                const transactionCount = await Transaction.countDocuments({
                    userId: userAny._id,
                    date: { $gte: startOfToday, $lte: endOfToday }
                });

                if (transactionCount === 0) {
                    await createNotification({
                        userId: userAny._id.toString(),
                        title: 'Daily Reminder',
                        type: NotificationType.DAILY_TRANSACTION_REMINDER,
                        message: `You haven't recorded any transactions today! Don't forget to log your expenses.`,
                        actionUrl: '/user-portal/all/all/transactions',
                        userEmail: userAny.email
                    });
                }
            }
        } catch (error) {
            console.error('TransactionReminder.Job ==> Error:', error);
        }
    });
};

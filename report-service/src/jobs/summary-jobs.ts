import cron from 'node-cron';
import User from '../models/user';
import Transaction from '../models/transaction';
import { createNotification, NotificationType } from '../services/notification.service';
import { Schema } from 'mongoose';

export const initSummaryJobs = () => {
    // --- Daily Summary (Every morning at 7 AM) ---
    cron.schedule('0 7 * * *', async () => {
        try {
            console.log('Summary.Job ==> Starting Daily Summaries.');
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const startOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
            const endOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59, 999);

            const users = await User.find({ enabled: true });

            for (const user of users) {
                const transactions = await Transaction.find({
                    userId: user._id,
                    date: { $gte: startOfYesterday, $lte: endOfYesterday },
                    type: 'EXPENSE'
                });

                let totalSpent = 0;
                transactions.forEach((tx: any) => {
                    totalSpent += parseFloat(tx.amount.toString());
                });

                await createNotification({
                    userId: user._id.toString(),
                    title: 'Your Daily Summary',
                    type: NotificationType.DAILY_SUMMARY,
                    message: `Yesterday, you spent a total of ${user.currency || 'Rs.'} ${totalSpent.toFixed(2)}. Open the app for detailed insights!`
                });
            }
        } catch (error) {
            console.error('Summary.Job ==> Daily Error:', error);
        }
    });

    // --- Weekly Summary (Every Monday at 8 AM) ---
    cron.schedule('0 8 * * 1', async () => {
        try {
            console.log('Summary.Job ==> Starting Weekly Summaries.');
            const now = new Date();
            const lastWeek = new Date();
            lastWeek.setDate(now.getDate() - 7);

            const users = await User.find({ enabled: true });

            for (const user of users) {
                const transactions = await Transaction.find({
                    userId: user._id,
                    date: { $gte: lastWeek, $lte: now },
                    type: 'EXPENSE'
                });

                let totalSpent = 0;
                transactions.forEach((tx: any) => {
                    totalSpent += parseFloat(tx.amount.toString());
                });

                await createNotification({
                    userId: user._id.toString(),
                    title: 'Weekly Financial Insight',
                    type: NotificationType.WEEKLY_SUMMARY,
                    message: `In the last 7 days, your total expenses were ${user.currency || 'Rs.'} ${totalSpent.toFixed(2)}. Check your weekly report for details.`
                });
            }
        } catch (error) {
            console.error('Summary.Job ==> Weekly Error:', error);
        }
    });

    // --- Monthly Summary (1st of every month at 9 AM) ---
    cron.schedule('0 9 1 * *', async () => {
        try {
            console.log('Summary.Job ==> Starting Monthly Summaries.');
            const now = new Date();
            const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

            const users = await User.find({ enabled: true });

            for (const user of users) {
                const transactions = await Transaction.find({
                    userId: user._id,
                    date: { $gte: startOfLastMonth, $lte: endOfLastMonth },
                    type: 'EXPENSE'
                });

                let totalSpent = 0;
                transactions.forEach((tx: any) => {
                    totalSpent += parseFloat(tx.amount.toString());
                });

                await createNotification({
                    userId: user._id.toString(),
                    title: 'Monthly Recap',
                    type: NotificationType.MONTHLY_SUMMARY,
                    message: `Last month recap: You spent ${user.currency || 'Rs.'} ${totalSpent.toFixed(2)}. See how this compares to your budget in the report dashboard.`
                });
            }
        } catch (error) {
            console.error('Summary.Job ==> Monthly Error:', error);
        }
    });
};

import cron from 'node-cron';
import Schedule from '../models/schedule';
import Transaction from '../models/transaction';
import User from '../models/user';
import { getNextDueDate } from '../utils/schedule.util';
import { createNotification, NotificationType } from '../services/notification.service';

export const initScheduleJobs = () => {
    cron.schedule('0 1 * * *', async () => {
        try {
            const today = new Date().toISOString().split("T")[0]
            console.log(`Schedule.Job ==> Process start for ${today}.`)
            const schedules = await Schedule.find({
                isActive: true,
                nextDueDate: today,
                isAutomated: true,
            });

            if (schedules.length === 0) {
                console.log(`Schedule.Job ==> No schedules found to confirm.`)
            }

            for (const schedule of schedules) {
                try {
                    // record the transaction
                    const transaction = await Transaction.create({
                        type: schedule.type,
                        amount: schedule.amount,
                        from: schedule.from,
                        to: schedule.to,
                        date: schedule.nextDueDate,
                        note: schedule.note,
                        pcategory: schedule.pcategory,
                        scategory: schedule.scategory,
                        userId: schedule.userId,
                        scheduleId: schedule._id
                    })

                    // update next due date
                    const nextDueDate = getNextDueDate(schedule.nextDueDate, schedule.endDate, schedule.recurrent, schedule.repeat, schedule.interval)
                    const updatedSchedule = await Schedule.findByIdAndUpdate(
                        schedule._id,
                        { nextDueDate: nextDueDate, isActive: nextDueDate != null },
                        { new: true }
                    );
                    console.log(`Schedule.Job ==> Confirmed schedule: ${schedule._id}`)

                    // Notify User
                    await createNotification({
                        userId: schedule.userId.toString(),
                        title: 'Schedule Processed',
                        type: NotificationType.SCHEDULE_ADDED_TO_TRANSACTION,
                        message: `A scheduled transaction for your order "${schedule.note || 'Recurring Item'}" has been processed.`,
                        actionUrl: `/user-portal/all/all/transactions`
                    });
                } catch(error) {
                    console.error(`Schedule.Job ==> Error in confirming schedule ${schedule._id}:`, error);
                }
            }
        } catch (error) {
            console.error('Schedule.Job ==> Error in subscription renewal job:', error);
        }
    });

    // Job to notify about manual schedules (Due/Overdue)
    cron.schedule('0 * * * *', async () => {
        try {
            const actualNow = new Date();
            
            // Floor to the top of the current hour to ensure deterministic window checking
            const now = new Date(actualNow);
            now.setMinutes(0, 0, 0);

            // 1-Hour Warning Window (e.g., if now is 12:00, warn items due 13:00-14:00)
            const targetHourStart1H = new Date(now.getTime() + 60 * 60 * 1000);
            const targetHourEnd1H = new Date(targetHourStart1H.getTime() + 60 * 60 * 1000);

            // 24-Hour Warning Window 
            const targetHourStart24H = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            const targetHourEnd24H = new Date(targetHourStart24H.getTime() + 60 * 60 * 1000);

            const startOfToday = new Date(now);
            startOfToday.setHours(0, 0, 0, 0);

            console.log(`Schedule.Job ==> Running manual schedule hourly checks for ${now.toISOString()}.`);

            const manualSchedules = await Schedule.find({
                isActive: true,
                isAutomated: false
            });

            for (const schedule of manualSchedules) {
                if (!schedule.nextDueDate) continue;
                
                const userAny = await User.findById(schedule.userId) as any;
                const nextDue = new Date(schedule.nextDueDate);

                // Check 1 Hour Reminder
                if (nextDue >= targetHourStart1H && nextDue < targetHourEnd1H) {
                    await createNotification({
                        userId: schedule.userId.toString(),
                        title: 'Manual Schedule Due Soon',
                        type: NotificationType.SCHEDULE_DUE_REMINDER,
                        message: `Reminder: Your manual schedule "${schedule.note || 'Item'}" is due in exactly 1 hour!`,
                        actionUrl: `/user-portal/all/all/schedules`,
                        userEmail: userAny?.email
                    });
                }
                
                // Check 24 Hour Reminder
                if (nextDue >= targetHourStart24H && nextDue < targetHourEnd24H) {
                    await createNotification({
                        userId: schedule.userId.toString(),
                        title: 'Manual Schedule Due Tomorrow',
                        type: NotificationType.SCHEDULE_DUE_REMINDER,
                        message: `Reminder: Your manual schedule "${schedule.note || 'Item'}" is due in 1 day.`,
                        actionUrl: `/user-portal/all/all/schedules`,
                        userEmail: userAny?.email
                    });
                }

                // Check Overdue (Only run this logic once a day at 11 AM)
                if (now.getHours() === 11) {
                    if (nextDue < startOfToday) {
                        await createNotification({
                            userId: schedule.userId.toString(),
                            title: 'Manual Schedule Overdue',
                            type: NotificationType.SCHEDULE_OVERDUE_REMINDER,
                            message: `Urgent: Your manual schedule "${schedule.note || 'Item'}" is overdue. Please confirm it!`,
                            actionUrl: `/user-portal/all/all/schedules`,
                            userEmail: userAny?.email
                        });
                    }
                }
            }
        } catch (error) {
            console.error('Schedule.Job ==> Error in manual reminder hourly job:', error);
        }
    });
};





import cron from 'node-cron';
import Space, { SpaceType, COLLABORATOR_STATUS } from '../models/space';
import User from '../models/user';
import Transaction from '../models/transaction';
import { createNotification, NotificationType } from '../services/notification.service';
import mongoose from 'mongoose';

export const checkDeadlines = async () => {
    try {
        const spaces = await Space.find({
            type: { $in: [SpaceType.LOAN_BORROWED, SpaceType.LOAN_LENT, SpaceType.CREDIT_CARD, SpaceType.SAVING_GOAL] }
        });

        const now = new Date();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        console.log(`[FINANCIAL-MONITOR] Starting check at ${now.toISOString()}. Monitoring ${spaces.length} spaces.`);

        // --- Daily Summary Trigger (at 10:00 AM) ---
        const currentHour = now.getHours();
        if (currentHour === 10) {
            console.log(`[FINANCIAL-MONITOR] Triggering DAILY_SUMMARY for all users.`);
            const allUsers = await User.find({});
            for (const user of allUsers) {
                await createNotification({
                    userId: (user as any)._id.toString(),
                    title: 'Daily Financial Summary',
                    type: NotificationType.DAILY_SUMMARY,
                    message: 'Good morning! Check your daily overview of assets and liabilities.',
                    actionUrl: '/user-portal/dashboard'
                });
            }
        }

        for (const space of spaces) {
            const spaceAny = space as any;
            try {
                // Fetch owner to get email
                const owner = await User.findById(space.ownerId);
                const userEmail = (owner as any)?.email;
                
                // Get all active collaborators to notify them too
                const collaboratorIds = space.collaborators
                    .filter(c => c.status === COLLABORATOR_STATUS.ACCEPTED)
                    .map(c => c.userId?.toString())
                    .filter(id => id !== undefined) as string[];

                const recipients = [space.ownerId.toString(), ...collaboratorIds];
                const uniqueRecipients = Array.from(new Set(recipients));

                const localSpaceType = (space.type as string).toLowerCase().replace(/_/g, '-');
                const actionUrl = `/user-portal/${localSpaceType}/${spaceAny._id.toString()}/dashboard`;

                // --- Loan Deadlines ---
                if (space.type === SpaceType.LOAN_BORROWED || space.type === SpaceType.LOAN_LENT) {
                    if (spaceAny.loanEndDate) {
                        const deadline = new Date(spaceAny.loanEndDate);
                        deadline.setHours(0, 0, 0, 0);
                        const diffDays = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                        if (diffDays === 7 || diffDays === 1 || diffDays < 0) {
                            const type = diffDays === 7 ? NotificationType.LOAN_REPAYMENT_7D 
                                       : diffDays === 1 ? NotificationType.LOAN_REPAYMENT_1D 
                                       : NotificationType.LOAN_OVERDUE;
                            const title = diffDays < 0 ? 'Loan Overdue' : `Loan Deadline (${diffDays} days)`;

                            for (const userId of uniqueRecipients) {
                                await createNotification({
                                    userId,
                                    title,
                                    type,
                                    message: `Status update for your loan "${space.name}".`,
                                    spaceId: spaceAny._id.toString(),
                                    actionUrl,
                                    userEmail
                                });
                            }
                        }
                    }
                }

                // --- Credit Card Deadlines ---
                if (space.type === SpaceType.CREDIT_CARD) {
                    // (Logic remains similar but can be refined if needed)
                    // Simplified for brevity in this turn, assuming existing logic is fine or slightly improved
                    const handleCCDate = async (date: any, type7d: NotificationType, type1d: NotificationType, typeOverdue: NotificationType, label: string) => {
                        if (!date) return;
                        const targetDate = new Date(date);
                        targetDate.setHours(0, 0, 0, 0);
                        const diff = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                        if (diff === 7 || diff === 1 || diff < 0) {
                            const type = diff === 7 ? type7d : diff === 1 ? type1d : typeOverdue;
                            for (const userId of uniqueRecipients) {
                                await createNotification({
                                    userId,
                                    title: `CC ${label} Update`,
                                    type,
                                    message: `Update for your card "${space.name}": ${label} is ${diff < 0 ? 'passed' : 'in ' + diff + ' days'}.`,
                                    spaceId: spaceAny._id.toString(),
                                    actionUrl,
                                    userEmail
                                });
                            }
                        }
                    };
                    await handleCCDate(spaceAny.creditCardStatementDate, NotificationType.CC_STATEMENT_7D, NotificationType.CC_STATEMENT_1D, NotificationType.CC_STATEMENT_OVERDUE, 'Statement');
                    await handleCCDate(spaceAny.creditCardDueDate, NotificationType.CC_DUE_7D, NotificationType.CC_DUE_1D, NotificationType.CC_DUE_OVERDUE, 'Payment Due');
                }

                // --- Saving Goals ---
                if (space.type === SpaceType.SAVING_GOAL) {
                    const goalActionUrl = `/user-portal/saving-goal/${spaceAny._id.toString()}/goals`;

                    // 1. Deadline Reminders
                    if (spaceAny.desiredDate) {
                        const deadline = new Date(spaceAny.desiredDate);
                        deadline.setHours(0, 0, 0, 0);
                        const diffGoal = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                        if (diffGoal === 7 || diffGoal === 2 || diffGoal < 0) {
                            const type = diffGoal === 7 ? NotificationType.SAVING_GOAL_DEADLINE_7D 
                                       : diffGoal === 2 ? NotificationType.SAVING_GOAL_DEADLINE_2D 
                                       : NotificationType.SAVING_GOAL_DEADLINE_PASSED;
                            
                            for (const userId of uniqueRecipients) {
                                await createNotification({
                                    userId,
                                    title: 'Goal Deadline Update',
                                    type,
                                    message: `Deadline alert for your goal: "${space.name}".`,
                                    spaceId: spaceAny._id.toString(),
                                    actionUrl: goalActionUrl,
                                    userEmail
                                });
                            }
                        }
                    }

                    // 2. Progress Thresholds
                    if (spaceAny.targetAmount) {
                        const target = parseFloat(spaceAny.targetAmount.toString());
                        if (target <= 0) continue;

                        // Enhanced Query: Check 'to', 'from', AND 'spaceId'
                        const transactions = await Transaction.find({
                            $or: [
                                { to: spaceAny._id },
                                { from: spaceAny._id },
                                { spaceId: spaceAny._id }
                            ]
                        });

                        let currentBalance = 0;
                        transactions.forEach(t => {
                            const amtString = t.amount.toString();
                            const amt = parseFloat(amtString);
                            // If a transaction is into the goal (to or spaceId with no from) it increases balance
                            // If a transaction is out of the goal (from) it decreases balance
                            const toId = (t as any).to?.toString();
                            const fromId = (t as any).from?.toString();
                            const sid = (t as any).spaceId?.toString();
                            const tid = spaceAny._id.toString();

                            if (toId === tid || (sid === tid && !fromId)) {
                                currentBalance += amt;
                            } else if (fromId === tid) {
                                currentBalance -= amt;
                            }
                        });

                        const progressPercent = (currentBalance / target) * 100;

                        // Sort thresholds descending [100, 75, 50, 25]
                        const thresholds = [100, 75, 50, 25];
                        const lastNotified = spaceAny.lastThresholdNotified || 0;
                        const currentHighestPassed = thresholds.find(t => progressPercent >= t) || 0;

                        console.log(`[FINANCIAL-MONITOR] Goal "${space.name}": Balance=${currentBalance}, Target=${target}, Percent=${progressPercent.toFixed(2)}%, LastNotified=${lastNotified}%, CurrentStage=${currentHighestPassed}%`);

                        // If user moved UP to a new (or previously hit) milestone stage
                        if (currentHighestPassed > lastNotified) {
                            // Find all missed thresholds between lastNotified and current
                            const milestonesToNotify = thresholds.filter(t => t > lastNotified && t <= currentHighestPassed).reverse();

                            for (const threshold of milestonesToNotify) {
                                let type = NotificationType.SAVING_GOAL_25;
                                let milestoneTitle = `Goal Progress (${threshold}%)`;
                                let milestoneMessage = `Great job! You've reached ${threshold}% of your goal: "${space.name}".`;

                                if (threshold === 100) {
                                    type = NotificationType.SAVING_GOAL_100;
                                    milestoneTitle = "🎯 Goal Achieved!";
                                    milestoneMessage = `Incredible! Mission accomplished. You've reached 100% of your goal: "${space.name}"!`;
                                } else if (threshold === 75) {
                                    type = NotificationType.SAVING_GOAL_75;
                                    milestoneTitle = "🚀 Almost There (75%)";
                                    milestoneMessage = `Three-quarters complete! You're in the home stretch for: "${space.name}".`;
                                } else if (threshold === 50) {
                                    type = NotificationType.SAVING_GOAL_50;
                                    milestoneTitle = "⭐️ Halfway Point (50%)";
                                    milestoneMessage = `Halfway mark reached! You're making fantastic progress on: "${space.name}".`;
                                } else if (threshold === 25) {
                                    milestoneTitle = "✨ Quarter Way (25%)";
                                    milestoneMessage = `First milestone hit! You're 25% of the way toward: "${space.name}".`;
                                }

                                console.log(`[FINANCIAL-MONITOR] Sending "${milestoneTitle}" for "${space.name}" to recipients:`, uniqueRecipients);

                                for (const userId of uniqueRecipients) {
                                    await createNotification({
                                        userId,
                                        title: milestoneTitle,
                                        type,
                                        message: milestoneMessage,
                                        spaceId: spaceAny._id.toString(),
                                        actionUrl: goalActionUrl,
                                        userEmail
                                    });
                                }
                            }
                        }

                        // Always sync lastThresholdNotified with reality to allow re-triggering upon drop + re-entry
                        if (currentHighestPassed !== lastNotified) {
                            await Space.findByIdAndUpdate(spaceAny._id, { lastThresholdNotified: currentHighestPassed });
                            console.log(`[FINANCIAL-MONITOR] Goal "${space.name}": Updated milestone stage from ${lastNotified}% to ${currentHighestPassed}%.`);
                        }
                    }
                }

            } catch (innerError) {
                console.error(`FinancialMonitor.Job ==> Error processing space ${spaceAny._id}:`, innerError);
            }
        }
    } catch (error) {
        console.error('FinancialMonitor.Job ==> Global Error:', error);
    }
};

export const initFinancialMonitorJobs = () => {
    // Run Hourly at minute 0
    cron.schedule('0 * * * *', async () => {
        console.log('[CRON] Executing hourly financial monitor check...');
        await checkDeadlines();
    });
};

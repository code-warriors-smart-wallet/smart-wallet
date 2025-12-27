import express, { Request, Response } from 'express';
import Schedule, { Frequency, RecurringApproval } from '../models/schedule';
import { authenticate } from '../middlewares/auth';
import Transaction, { MemberStatus } from '../models/transaction';
import { getNextDueDate } from '../utils/schedule.util';
import { getUsersBySpace } from './dashboard';
import { Types } from 'mongoose';

const scheduleRouter = express.Router();

scheduleRouter.post('/', authenticate, async (req: Request, res: Response) => {
    try {
        const userId: string = (req as any).user.id;
        const body = req.body

        const schedule = await Schedule.create({
            type: body.type,
            amount: body.amount,
            from: body.from,
            to: body.to,
            note: body.note,
            pcategory: body.pcategory,
            scategory: body.scategory,
            userId: userId,
            startDate: body.startDate,
            nextDueDate: body.startDate,
            recurrent: body.frequency === Frequency.RECURRENT,
            repeat: body.repeat,
            interval: body.interval,
            isAutomated: body.recurringApproval === RecurringApproval.AUTO,
            endDate: body.endDate,
            isActive: true,
            spaceId: body.spaceId
        })

        res.status(201).json({
            success: true,
            data: {
                object: schedule,
                message: 'Schedule created successfully'
            },
            error: null
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            success: false,
            error: { message: 'Error creating transaction: ' + errorMessage },
            data: null
        });
    }

})

scheduleRouter.put('/confirm/:id', authenticate, async (req: Request, res: Response) => {
    try {
        const userId: string = (req as any).user.id;
        const { id } = req.params;

        let schedule = await Schedule.findOne({
            _id: id,
            userId: userId
        })

        if (!schedule) {
            res.status(404).json({
                success: false,
                error: { message: 'Schedule not Found' },
                data: null
            });
            return;
        }

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
            scheduleId: schedule._id,
            spaceId: schedule.spaceId
        })

        // update next due date
        const nextDueDate = getNextDueDate(schedule.nextDueDate, schedule.endDate, schedule.recurrent, schedule.repeat, schedule.interval)
        console.log(nextDueDate)
        schedule = await Schedule.findByIdAndUpdate(
            schedule._id,
            { nextDueDate: nextDueDate, isActive: nextDueDate != null },
            { new: true }
        );

        res.status(201).json({
            success: true,
            data: {
                object: { schedule, transaction },
                message: 'Schedule confirmed successfully'
            },
            error: null
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            success: false,
            error: { message: 'Error confirming transaction: ' + errorMessage },
            data: null
        });
    }

})

scheduleRouter.put('/skip/:id', authenticate, async (req: Request, res: Response) => {
    try {
        const userId: string = (req as any).user.id;
        const { id } = req.params;

        let schedule = await Schedule.findOne({
            _id: id,
            userId: userId
        })

        if (!schedule) {
            res.status(404).json({
                success: false,
                error: { message: 'Schedule not Found' },
                data: null
            });
            return;
        }

        // update next due date
        const nextDueDate = getNextDueDate(schedule.nextDueDate, schedule.endDate, schedule.recurrent, schedule.repeat, schedule.interval)
        console.log(nextDueDate)
        schedule = await Schedule.findByIdAndUpdate(
            schedule._id,
            { nextDueDate: nextDueDate, isActive: nextDueDate != null },
            { new: true }
        );

        res.status(201).json({
            success: true,
            data: {
                object: { schedule },
                message: 'Schedule skipped successfully'
            },
            error: null
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            success: false,
            error: { message: 'Error skipping transaction: ' + errorMessage },
            data: null
        });
    }

})

scheduleRouter.put('/:id', authenticate, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const body = req.body
        const userId: string = (req as any).user.id;

        const existingSchedule = await Schedule.findOne({ _id: id, userId: userId });

        if (!existingSchedule) {
            res.status(404).json({
                success: false,
                error: { message: 'Transation not Found' },
                data: null
            });
            return;
        }

        const schedule = await Schedule.updateOne({ _id: id }, {
            $set: {
                type: body.type,
                amount: body.amount,
                from: body.from,
                to: body.to,
                note: body.note,
                pcategory: body.pcategory,
                scategory: body.scategory,
                userId: userId,
                startDate: body.startDate,
                nextDueDate: body.startDate,
                recurrent: body.frequency === Frequency.RECURRENT,
                repeat: body.repeat,
                interval: body.interval,
                isAutomated: body.recurringApproval === RecurringApproval.AUTO,
                endDate: body.endDate,
                isActive: true,
                spaceId: body.spaceId
            }
        })

        res.status(200).json({
            success: true,
            data: {
                object: schedule,
                message: 'Schedule updated successfully'
            },
            error: null
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            success: false,
            error: { message: 'Error updating transaction: ' + errorMessage },
            data: null
        });
    }

})

scheduleRouter.delete('/:id', authenticate, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId: string = (req as any).user.id;

        const existingSchedule = await Schedule.findOne({ _id: id, userId: userId });

        if (!existingSchedule) {
            res.status(404).json({
                success: false,
                error: { message: 'Schedule not Found' },
                data: null
            });
            return;
        }

        await Schedule.deleteOne({ _id: id });

        res.status(200).json({ success: true, message: "Schedule deleted successfully" });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            success: false,
            error: { message: 'Error deleting transaction: ' + errorMessage },
            data: null
        });
    }
})

scheduleRouter.get('/user/:spaceid/:limit/:skip', authenticate, async (req: Request, res: Response) => {
    try {
        const userId: string = (req as any).user.id;
        const { spaceid, skip, limit } = req.params;

        const userIds = await getUsersBySpace(spaceid)

        let condition: any = {
            $and: [
                { userId: {$in: userIds} },
                {
                    $or: [
                        { from: spaceid },
                        { to: spaceid }
                    ]
                }
            ]
        }
        
        if (spaceid === "all") {
            condition = { userId: userId }
        }

        const schedules = await Schedule.find(condition)
            .skip(Number.parseInt(skip))
            .limit(Number.parseInt(limit))
            .sort({ isActive: -1, nextDueDate: 1 })
            .populate({
                path: "userId",        
                select: "username"     
            });

        const total = await Schedule.countDocuments(condition);
        res.status(200).json({
            success: true,
            data: {
                object: {
                    schedules, total, userIds
                },
                message: 'Schedules retrieved successfully!'
            },
            error: null
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            success: false,
            error: { message: 'Error finding transactions: ' + errorMessage },
            data: null
        });
    }
})

scheduleRouter.patch('/spaces/:spaceId/members/:userId/status', authenticate, async (req: Request, res: Response) => {
    try {
        const { spaceId, userId } = req.params;
        const { memberStatus } = req.body;

        // Validate memberStatus
        if (!Object.values(MemberStatus).includes(memberStatus)) {
            res.status(400).json({
                message: "Invalid member status",
            });
        }

        const result = await Schedule.updateMany(
            {
                spaceId: new Types.ObjectId(spaceId),
                userId: new Types.ObjectId(userId),
            },
            {
                $set: { memberStatus },
            }
        );

        res.status(200).json({
            success: true,
            data: {
                object: {
                    modifiedCount: result.modifiedCount,
                },
                message: "Member status updated successfully"
            },
            error: null
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error("Update member status error:", error);
        res.status(500).json({
            success: false,
            error: { message: 'Error updating member staus: ' + errorMessage },
            data: null
        });
    }

})

export default scheduleRouter;

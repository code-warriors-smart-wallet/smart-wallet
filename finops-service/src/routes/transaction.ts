import express, { Request, Response } from 'express';
import Transaction, { MemberStatus } from '../models/transaction';
import Space, { ISpace, SpaceType } from '../models/space';
import { authenticate } from '../middlewares/auth';
import { Types } from 'mongoose';
import mongoose from 'mongoose';
import { checkDeadlines } from '../jobs/financial-monitor';

const transactionRouter = express.Router();

transactionRouter.get('/trigger-monitor', async (req: Request, res: Response) => {
    try {
        console.log(">>>> Manual Monitor Triggered");
        await checkDeadlines();
        res.status(200).json({
            success: true,
            message: 'Financial monitor triggered and executed successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: { message: 'Error triggering monitor: ' + (error instanceof Error ? error.message : 'Unknown') }
        });
    }
});

transactionRouter.post('/', authenticate, async (req: Request, res: Response) => {
    try {
        const userId: string = (req as any).user.id;

        const transaction = await Transaction.create({ ...req.body, userId: userId })

        // Trigger the financial monitor asynchronously to process goal milestones instantly
        checkDeadlines().catch(err => console.error("Error running monitor after transaction creation", err));

        res.status(201).json({
            success: true,
            data: {
                object: transaction,
                message: 'Transaction created successfully'
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

transactionRouter.get('/:id', authenticate, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId: string = (req as any).user.id;

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            res.status(400).json({
                success: false,
                error: { message: 'Invalid transaction ID format' },
                data: null
            });
            return;
        }

        const transaction = await Transaction.findOne({ _id: id, userId: userId });

        if (!transaction) {
            res.status(404).json({
                success: false,
                error: { message: 'Transaction not found' },
                data: null
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: {
                object: transaction,
                message: 'Transaction retrieved successfully'
            },
            error: null
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            success: false,
            error: { message: 'Error getting transaction: ' + errorMessage },
            data: null
        });
    }
});

transactionRouter.put('/:id', authenticate, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId: string = (req as any).user.id;

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            res.status(400).json({
                success: false,
                error: { message: 'Invalid transaction ID format' },
                data: null
            });
            return;
        }

        const existingTransaction = await Transaction.findOne({
            _id: id,
            userId: userId
        });

        if (!existingTransaction) {
            res.status(404).json({
                success: false,
                error: { message: 'Transation not Found' },
                data: null
            });
            return;
        }

        // Save the old transaction data for budget updates
        const oldTransaction = { ...existingTransaction.toObject() };

        // Update the transaction
        const updatedTransaction = await Transaction.findByIdAndUpdate(
            id,
            { $set: { ...req.body, userId: userId } },
            { new: true, runValidators: true }
        );

        // Trigger the financial monitor asynchronously to process goal milestones instantly
        checkDeadlines().catch(err => console.error("Error running monitor after transaction update", err));

        // const transaction = await Transaction.updateOne({ _id: id }, { $set: { ...req.body, userId: userId } })

        res.status(200).json({
            success: true,
            data: {
                object: updatedTransaction,
                oldObject: oldTransaction,
                message: 'Transaction updated successfully'
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

transactionRouter.delete('/:id', authenticate, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId: string = (req as any).user.id;

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            res.status(400).json({
                success: false,
                error: { message: 'Invalid transaction ID format' },
                data: null
            });
            return;
        }

        const existingTransaction = await Transaction.findOne({ _id: id, userId: userId });

        if (!existingTransaction) {
            res.status(404).json({
                success: false,
                error: { message: 'Transaction not Found' },
                data: null
            });
            return;
        }

        // Return the transaction data before deleting for budget updates
        const transactionData = { ...existingTransaction.toObject() };

        await Transaction.deleteOne({ _id: id });

        // Trigger the financial monitor asynchronously to process goal milestones instantly
        checkDeadlines().catch(err => console.error("Error running monitor after transaction deletion", err));

        res.status(200).json({
            success: true,
            data: {
                object: transactionData,
                message: "Transaction deleted successfully"
            }
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            success: false,
            error: { message: 'Error deleting transaction: ' + errorMessage },
            data: null
        });
    }
})

transactionRouter.get('/user/:spaceid/:limit/:skip', authenticate, async (req: Request, res: Response) => {
    try {
        const userId: string = (req as any).user.id;
        const { spaceid, skip, limit } = req.params;

        const userIds = await getUsersBySpace(spaceid)

        let condition: any = {
            $and: [
                { userId: { $in: userIds } },
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

        const transactions = await Transaction.find(condition)
            .skip(Number.parseInt(skip))
            .limit(Number.parseInt(limit))
            .sort({ date: -1 })
            .populate({
                path: "userId",
                select: "username"
            });

        const total = await Transaction.countDocuments(condition);
        res.status(200).json({
            success: true,
            data: {
                object: {
                    transactions, total
                },
                message: 'Transactions retrieved successfully!'
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

transactionRouter.post('/search', authenticate, async (req: Request, res: Response) => {
    try {
        const userId: string = (req as any).user.id;
        const { space, type, mcategory, scategory, fromDate, toDate, spaceid, skip, limit, keyword, sortBy } = req.body;

        const userIds = await getUsersBySpace(spaceid)

        let condition: any = {
            $and: [
                { userId: { $in: userIds } },
                {
                    $or: [
                        { from: spaceid },
                        { to: spaceid }
                    ]
                }
            ]
        }

        if (spaceid === "all") {
            if (space) {
                condition = {
                    $and: [
                        { userId: userId },
                        {
                            $or: [
                                { from: space },
                                { to: space }
                            ]
                        }
                    ]
                }
            } else {
                condition = { userId: userId }
            }
        }

        if (type) {
            condition.$and = condition.$and || [];
            condition.$and.push({ type: type });
        }

        if (mcategory) {
            condition.$and = condition.$and || [];
            condition.$and.push({ pcategory: mcategory });
        }

        if (scategory) {
            condition.$and = condition.$and || [];
            condition.$and.push({ scategory: scategory });
        }

        if (fromDate) {
            condition.$and = condition.$and || [];
            condition.$and.push({ date: { $gte: new Date(fromDate) } });
        }

        if (toDate) {
            condition.$and = condition.$and || [];
            condition.$and.push({ date: { $lte: new Date(toDate) } });
        }

        if (keyword) {
            condition.$and = condition.$and || [];
            condition.$and.push({ note: { $regex: keyword, $options: "i" } });
        }

        let sortByCondition: any = { date: -1 }
        if (sortBy) {
            if (sortBy === "AA") {
                sortByCondition = {amount: 1}
            } else if (sortBy === "AD") {
                sortByCondition = {amount: -1}
            } else if (sortBy === "DA") {
                sortByCondition = {date: 1}
            } else if (sortBy === "DD") {
                sortByCondition = {date: -1}
            }
        }


        const transactions = await Transaction.find(condition)
            .skip(Number.parseInt(skip))
            .limit(Number.parseInt(limit))
            .sort(sortByCondition)
            .populate({
                path: "userId",
                select: "username"
            });

        const total = await Transaction.countDocuments(condition);
        res.status(200).json({
            success: true,
            data: {
                object: {
                    transactions, total
                },
                message: 'Transactions retrieved successfully!'
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

transactionRouter.patch('/spaces/:spaceId/members/:userId/status', authenticate, async (req: Request, res: Response) => {
    try {
        const { spaceId, userId } = req.params;
        const { memberStatus } = req.body;

        // Validate memberStatus
        if (!Object.values(MemberStatus).includes(memberStatus)) {
            res.status(400).json({
                message: "Invalid member status",
            });
        }

        const result = await Transaction.updateMany(
            {
                spaceId: new Types.ObjectId(spaceId),
                userId: new Types.ObjectId(userId),
            },
            {
                $set: { memberStatus },
            }
        );

        console.log(">>>>", spaceId, userId, result.modifiedCount);

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
export default transactionRouter;

export const getUsersBySpace = async (spaceid: string) => {
    if (spaceid === "all") return []

    const space = await Space.findById(spaceid)
        .select("ownerId collaborators")
        .lean();

    if (!space) {
        return [];
    }

    const userIds = [
        space.ownerId,
        ...(space.collaborators?.map(c => c.userId) ?? [])
    ];

    return userIds
}

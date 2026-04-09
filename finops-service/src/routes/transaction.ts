import express, { Request, Response } from 'express';
import Transaction, { MemberStatus, TransactionType } from '../models/transaction';
import Space, { ISpace, SpaceType } from '../models/space';
import Cat from '../models/category';
import { authenticate } from '../middlewares/auth';
import { Types } from 'mongoose';
import mongoose from 'mongoose';

const transactionRouter = express.Router();

transactionRouter.post('/', authenticate, async (req: Request, res: Response) => {
    try {
        const userId: string = (req as any).user.id;

        const transaction = await Transaction.create({ ...req.body, userId: userId })

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

// Safely converts any form of ObjectId to a proper mongoose.Types.ObjectId.
// Handles: BSON ObjectId instances, plain strings, and MongoDB Extended JSON { $oid: '...' } objects.
function toObjectId(id: any): mongoose.Types.ObjectId {
    if (!id) throw new Error('ObjectId value is null or undefined');
    if (id instanceof mongoose.Types.ObjectId) return id;
    if (typeof id === 'string') return new mongoose.Types.ObjectId(id);
    if (typeof id === 'object') {
        if (id.$oid) return new mongoose.Types.ObjectId(id.$oid);
        if (typeof id.toHexString === 'function') return new mongoose.Types.ObjectId(id.toHexString());
    }
    throw new Error(`Cannot convert value to ObjectId: ${JSON.stringify(id)}`);
}

transactionRouter.post('/import', authenticate, async (req: Request, res: Response) => {
    try {
        const userId: string = (req as any).user.id;
        const { rows } = req.body;

        if (!Array.isArray(rows) || rows.length === 0) {
            res.status(400).json({
                success: false,
                error: { message: 'No rows provided for import' },
                data: null
            });
            return;
        }

        if (rows.length > 500) {
            res.status(400).json({
                success: false,
                error: { message: 'Maximum 500 rows per import' },
                data: null
            });
            return;
        }

        // Fetch all spaces the user owns or collaborates in
        // Do NOT use .lean() — Mongoose documents guarantee proper ObjectId instances
        const userSpaces = await Space.find({
            $or: [
                { ownerId: new mongoose.Types.ObjectId(userId) },
                { 'collaborators.userId': new mongoose.Types.ObjectId(userId) }
            ]
        }) as any[];

        // Fetch all categories — no .lean() for the same reason
        const allCategories = await Cat.find({}) as any[];

        const imported: any[] = [];
        const failed: { row: number; reason: string; data: any }[] = [];

        const validTypes = new Set(Object.values(TransactionType));

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rowNum = i + 1;

            try {
                // 1. Validate type
                if (!row.type || !validTypes.has(row.type)) {
                    failed.push({ row: rowNum, reason: `Invalid transaction type: "${row.type}"`, data: row });
                    continue;
                }

                // 2. Validate amount
                const amount = parseFloat(row.amount);
                if (!row.amount || isNaN(amount) || amount <= 0) {
                    failed.push({ row: rowNum, reason: `Invalid amount: "${row.amount}". Must be a positive number.`, data: row });
                    continue;
                }

                // 3. Validate date
                if (!row.date || isNaN(new Date(row.date).getTime())) {
                    failed.push({ row: rowNum, reason: `Invalid date: "${row.date}". Use YYYY-MM-DD format.`, data: row });
                    continue;
                }

                // 4. Resolve active space (spaceId)
                if (!row.spaceName || row.spaceName.trim() === '') {
                    failed.push({ row: rowNum, reason: 'Space is required', data: row });
                    continue;
                }
                const activeSpace = userSpaces.find(
                    s => s.name.toLowerCase() === row.spaceName.trim().toLowerCase()
                );
                if (!activeSpace) {
                    failed.push({ row: rowNum, reason: `Space not found: "${row.spaceName}"`, data: row });
                    continue;
                }

                // 5. Resolve from space (null = outside wallet)
                let fromSpaceId: any = null;
                if (row.fromSpaceName && row.fromSpaceName.trim() !== '') {
                    const fromSpace = userSpaces.find(
                        s => s.name.toLowerCase() === row.fromSpaceName.trim().toLowerCase()
                    );
                    if (!fromSpace) {
                        failed.push({ row: rowNum, reason: `From space not found: "${row.fromSpaceName}"`, data: row });
                        continue;
                    }
                    fromSpaceId = fromSpace._id;
                }

                // 6. Resolve to space (null = outside wallet)
                let toSpaceId: any = null;
                if (row.toSpaceName && row.toSpaceName.trim() !== '') {
                    const toSpace = userSpaces.find(
                        s => s.name.toLowerCase() === row.toSpaceName.trim().toLowerCase()
                    );
                    if (!toSpace) {
                        failed.push({ row: rowNum, reason: `To space not found: "${row.toSpaceName}"`, data: row });
                        continue;
                    }
                    toSpaceId = toSpace._id;
                }

                // 7. Resolve parent category
                if (!row.pcategoryName || row.pcategoryName.trim() === '') {
                    failed.push({ row: rowNum, reason: 'Category is required', data: row });
                    continue;
                }
                const parentCategory = allCategories.find(
                    c => c.parentCategory.toLowerCase() === row.pcategoryName.trim().toLowerCase()
                );
                if (!parentCategory) {
                    failed.push({ row: rowNum, reason: `Category not found: "${row.pcategoryName}"`, data: row });
                    continue;
                }

                // 8. Resolve sub category
                if (!row.scategoryName || row.scategoryName.trim() === '') {
                    failed.push({ row: rowNum, reason: 'Sub category is required', data: row });
                    continue;
                }
                const subCategory = parentCategory.subCategories.find(
                    (sc: any) => sc.name.toLowerCase() === row.scategoryName.trim().toLowerCase()
                );
                if (!subCategory) {
                    failed.push({ row: rowNum, reason: `Sub category "${row.scategoryName}" not found in category "${row.pcategoryName}"`, data: row });
                    continue;
                }

                // 9. Create transaction
                const transaction = await Transaction.create({
                    type: row.type,
                    amount: mongoose.Types.Decimal128.fromString(amount.toFixed(2)),
                    from: fromSpaceId,
                    to: toSpaceId,
                    date: new Date(row.date),
                    note: row.note || '',
                    pcategory: parentCategory._id,
                    scategory: subCategory._id,
                    userId: new mongoose.Types.ObjectId(userId),
                    spaceId: activeSpace._id,
                });

                imported.push(transaction);
            } catch (rowError) {
                const reason = rowError instanceof Error ? rowError.message : 'Unknown error';
                failed.push({ row: rowNum, reason, data: row });
            }
        }

        res.status(200).json({
            success: true,
            data: {
                object: {
                    imported: imported.length,
                    failed,
                    total: rows.length
                },
                message: `Import complete: ${imported.length} imported, ${failed.length} failed`
            },
            error: null
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            success: false,
            error: { message: 'Error importing transactions: ' + errorMessage },
            data: null
        });
    }
});

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

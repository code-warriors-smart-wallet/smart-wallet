import express, { Request, Response } from 'express';
import Budget from '../models/budget';
import { authenticate } from '../middlewares/auth';
import Transaction from '../models/transaction';
import Category from '../models/category';
import { TransactionType } from '../models/transaction';
import mongoose, { Types } from 'mongoose';

const budgetRouter = express.Router();

// Helper function to safely convert amount to number
const convertAmountToNumber = (amount: any): number => {
    if (typeof amount === 'number') {
        return amount;
    } else if (typeof amount === 'string') {
        return parseFloat(amount);
    } else if (amount && typeof amount === 'object' && 'toString' in amount) {
        // Handle Decimal128 or other objects with toString
        return parseFloat(amount.toString());
    }
    return 0;
};

// Helper function to get category breakdown
const getCategoryBreakdown = async (query: any) => {
    try {
        const pipeline: mongoose.PipelineStage[] = [
            { $match: query },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'scategory',
                    foreignField: '_id',
                    as: 'categoryInfo'
                }
            },
            { $unwind: { path: '$categoryInfo', preserveNullAndEmptyArrays: true } },
            {
                $group: {
                    _id: {
                        subCategoryId: '$scategory',
                        subCategoryName: '$categoryInfo.name'
                    },
                    totalAmount: { $sum: { $toDouble: '$amount' } },
                    transactionCount: { $sum: 1 }
                }
            },
            {
                $project: {
                    subCategoryId: '$_id.subCategoryId',
                    subCategoryName: '$_id.subCategoryName',
                    totalAmount: 1,
                    transactionCount: 1,
                    _id: 0
                }
            },
            { $sort: { totalAmount: -1 } }
        ];

        const breakdown = await Transaction.aggregate(pipeline);
        return breakdown;
    } catch (error) {
        console.error('Error getting category breakdown:', error);
        return [];
    }
};

// Create a new budget
budgetRouter.post('/', authenticate, async (req: Request, res: Response) => {
    try {
        const userId: string = (req as any).user.id;
        const { name, amount, type, mainCategoryId, subCategoryIds, spaceId, spaceType, startDate, endDate } = req.body;

        const budget = await Budget.create({ 
            name, 
            amount, 
            type, 
            mainCategoryId, 
            subCategoryIds, 
            spaceId, 
            spaceType,
            startDate,
            endDate,
            userId: userId 
        });

        res.status(201).json({
            success: true,
            data: {
                object: budget,
                message: 'Budget created successfully'
            },
            error: null
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            success: false,
            error: { message: 'Error creating budget: ' + errorMessage },
            data: null
        });
    }
});

// Update a budget
budgetRouter.put('/:id', authenticate, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId: string = (req as any).user.id;
        const { name, amount, type, mainCategoryId, subCategoryIds, spaceId, spaceType, startDate, endDate } = req.body;

        const existingBudget = await Budget.findOne({ _id: id, userId: userId });

        if (!existingBudget) {
            res.status(404).json({
                success: false,
                error: { message: 'Budget not found' },
                data: null
            });
            return;
        }

        const updatedBudget = await Budget.findByIdAndUpdate(
            id,
            { 
                $set: { 
                    name, 
                    amount, 
                    type, 
                    mainCategoryId, 
                    subCategoryIds, 
                    spaceId, 
                    spaceType,
                    startDate,
                    endDate,
                    userId: userId 
                } 
            },
            { new: true }
        );

        res.status(200).json({
            success: true,
            data: {
                object: updatedBudget,
                message: 'Budget updated successfully'
            },
            error: null
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            success: false,
            error: { message: 'Error updating budget: ' + errorMessage },
            data: null
        });
    }
});

// Delete a budget
budgetRouter.delete('/:id', authenticate, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId: string = (req as any).user.id;

        const existingBudget = await Budget.findOne({ _id: id, userId: userId });

        if (!existingBudget) {
            res.status(404).json({
                success: false,
                error: { message: 'Budget not found' },
                data: null
            });
            return;
        }

        await Budget.deleteOne({ _id: id });

        res.status(200).json({
            success: true,
            data: {
                message: 'Budget deleted successfully'
            },
            error: null
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            success: false,
            error: { message: 'Error deleting budget: ' + errorMessage },
            data: null
        });
    }
});

// Get all budgets for a user
budgetRouter.get('/', authenticate, async (req: Request, res: Response) => {
    try {
        const userId: string = (req as any).user.id;

        const budgets = await Budget.find({ userId: userId }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: {
                object: budgets,
                message: 'Budgets retrieved successfully!'
            },
            error: null
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            success: false,
            error: { message: 'Error finding budgets: ' + errorMessage },
            data: null
        });
    }
});

// Get budgets by space ID
budgetRouter.get('/space/:spaceId', authenticate, async (req: Request, res: Response) => {
    try {
        const userId: string = (req as any).user.id;
        const { spaceId } = req.params;

        const budgets = await Budget.find({ 
            userId: userId, 
            spaceId: spaceId 
        }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: {
                object: budgets,
                message: 'Budgets retrieved successfully!'
            },
            error: null
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            success: false,
            error: { message: 'Error finding budgets: ' + errorMessage },
            data: null
        });
    }
});

// Get budgets by space type
budgetRouter.get('/space-type/:spaceType', authenticate, async (req: Request, res: Response) => {
    try {
        const userId: string = (req as any).user.id;
        const { spaceType } = req.params;

        const budgets = await Budget.find({ 
            userId: userId, 
            spaceType: spaceType 
        }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: {
                object: budgets,
                message: 'Budgets retrieved successfully!'
            },
            error: null
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            success: false,
            error: { message: 'Error finding budgets: ' + errorMessage },
            data: null
        });
    }
});

// Get budget spending
budgetRouter.get('/:id/spending', authenticate, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId: string = (req as any).user.id;

        // Find the budget
        const budget = await Budget.findOne({ _id: id, userId: userId });

        if (!budget) {
            res.status(404).json({
                success: false,
                error: { message: 'Budget not found' },
                data: null
            });
            return;
        }

        // Get budget details
        const budgetStartDate = budget.startDate ? new Date(budget.startDate) : new Date();
        const budgetEndDate = budget.endDate ? new Date(budget.endDate) : new Date();
        const budgetAmount = convertAmountToNumber(budget.amount);
        
        // Build query for transactions
        const query: any = {
            userId: new Types.ObjectId(userId),
            spaceId: new Types.ObjectId(budget.spaceId.toString()),
            date: {
                $gte: budgetStartDate,
                $lte: budgetEndDate
            }
        };

        // Get all subcategories under the main category
        let targetSubCategoryIds: Types.ObjectId[] = [];
        
        if (budget.subCategoryIds && budget.subCategoryIds.length > 0) {
            // Use specific subcategories if provided
            targetSubCategoryIds = budget.subCategoryIds.map((id: any) => new Types.ObjectId(id.toString()));
        } else {
            // Get all subcategories under the main category
            const subCategories = await Category.find({
                parentCategoryId: new Types.ObjectId(budget.mainCategoryId.toString())
            });
            targetSubCategoryIds = subCategories.map((subCat: any) => new Types.ObjectId(subCat._id.toString()));
        }
        
        
        // Add subcategory filter to query
        if (targetSubCategoryIds.length > 0) {
            query.scategory = { $in: targetSubCategoryIds };
        }
        
        // Filter by transaction type based on space type - FIXED LOGIC
        switch (budget.spaceType) {
            case 'CASH':
            case 'BANK':
                // For CASH and BANK spaces, track EXPENSE transactions
                query.type = TransactionType.EXPENSE;
                break;
            case 'CREDIT_CARD':
                // For CREDIT_CARD spaces, track BALANCE_INCREASE transactions (spending)
                query.type = TransactionType.BALANCE_INCREASE;
                break;
            default:
                // For other space types, budgets don't apply
                query.type = TransactionType.EXPENSE;
        }

        console.log('Budget spending query:', JSON.stringify(query, null, 2));
        console.log('Space Type:', budget.spaceType);
        console.log('Transaction Type:', query.type);
        console.log('Subcategory IDs:', targetSubCategoryIds.map(id => id.toString()));

        // Get all transactions for this budget
        const transactions = await Transaction.find(query).sort({ date: 1 });

        // Calculate total spent
        let totalSpent = 0;
        const dailySpending: { date: string; amount: number }[] = [];
        
        // Group transactions by date for daily spending
        const spendingByDate = new Map<string, number>();
        
        transactions.forEach(transaction => {
            const amount = convertAmountToNumber(transaction.amount);
            totalSpent += amount;
            
            // Format date to YYYY-MM-DD
            let dateStr: string;
            if (transaction.date instanceof Date) {
                dateStr = transaction.date.toISOString().split('T')[0];
            } else if (typeof transaction.date === 'string') {
                dateStr = new Date(transaction.date).toISOString().split('T')[0];
            } else {
                dateStr = new Date().toISOString().split('T')[0];
            }
            
            if (spendingByDate.has(dateStr)) {
                spendingByDate.set(dateStr, spendingByDate.get(dateStr)! + amount);
            } else {
                spendingByDate.set(dateStr, amount);
            }
        });

        // Convert spendingByDate to array
        spendingByDate.forEach((amount, date) => {
            dailySpending.push({
                date,
                amount
            });
        });

        // Sort daily spending by date
        dailySpending.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // Calculate remaining amount and percentage
        const remainingAmount = Math.max(0, budgetAmount - totalSpent);
        const percentage = budgetAmount > 0 ? (totalSpent / budgetAmount) * 100 : 0;
        const isOverBudget = totalSpent > budgetAmount;
        const overBudgetAmount = Math.max(0, totalSpent - budgetAmount);

        // Get category breakdown if needed
        const categoryBreakdown = await getCategoryBreakdown(query);

        const spendingData = {
            budgetId: budget._id,
            budgetName: budget.name,
            budgetAmount,
            totalSpent,
            remainingAmount,
            percentage: Math.min(percentage, 100),
            overBudgetAmount,
            isOverBudget,
            dailySpending,
            categoryBreakdown,
            startDate: budget.startDate,
            endDate: budget.endDate,
            totalTransactions: transactions.length,
            queryDetails: {
                spaceType: budget.spaceType,
                transactionType: query.type,
                subCategoryCount: targetSubCategoryIds.length,
                dateRange: {
                    start: budgetStartDate,
                    end: budgetEndDate
                }
            }
        };

        console.log('Spending Data:', {
            budgetAmount,
            totalSpent,
            percentage,
            transactionsCount: transactions.length
        });

        res.status(200).json({
            success: true,
            data: {
                object: spendingData,
                message: 'Budget spending retrieved successfully!'
            },
            error: null
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error calculating budget spending:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Error calculating budget spending: ' + errorMessage },
            data: null
        });
    }
});


export default budgetRouter;

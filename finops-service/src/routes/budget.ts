// import express, { Request, Response } from "express";
// import Budget from "../models/budget";
// import BudgetEntry from "../models/budget-entry";
// import { authenticate } from "../middlewares/auth";
// import Transaction from "../models/transaction";
// import Category from "../models/category";
// import { TransactionType } from "../models/transaction";
// import mongoose, { Types } from "mongoose";

// const budgetRouter = express.Router();

// // Helper function to safely convert amount to number
// const convertAmountToNumber = (amount: any): number => {
//     if (typeof amount === "number") {
//         return amount;
//     } else if (typeof amount === "string") {
//         return parseFloat(amount);
//     } else if (amount && typeof amount === "object" && "toString" in amount) {
//         return parseFloat(amount.toString());
//     }
//     return 0;
// };

// const getStartOfDay = (date: Date): Date => {
//     const start = new Date(date);
//     start.setUTCHours(0, 0, 0, 0);
//     return start;
// };

// const getEndOfDay = (date: Date): Date => {
//     const end = new Date(date);
//     end.setUTCHours(23, 59, 59, 999);
//     return end;
// };

// // function to get start of week (Monday)
// const getStartOfWeek = (date: Date): Date => {
//     const day = date.getUTCDay();
//     const diff = date.getUTCDate() - day + (day === 0 ? -6 : 1);
//     const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), diff));
//     return getStartOfDay(start);
// };

// // function to get end of week (Sunday)
// const getEndOfWeek = (date: Date): Date => {
//     const start = getStartOfWeek(new Date(date));
//     const end = new Date(start);
//     end.setUTCDate(start.getUTCDate() + 6);
//     return getEndOfDay(end);
// };

// // function to get start of month (1st day)
// const getStartOfMonth = (date: Date): Date => {
//     const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
//     return getStartOfDay(start);
// };

// // function to get end of month (last day)
// const getEndOfMonth = (date: Date): Date => {
//     const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
//     return getEndOfDay(end);
// };

// // function to calculate budget dates based on type
// const calculateBudgetDates = (type: string, baseDate: Date = new Date()): { startDate: Date; endDate: Date } | null => {
//     let startDate: Date;
//     let endDate: Date;

//     const date = new Date(baseDate.toISOString());

//     switch (type) {
//         case "WEEKLY":
//             const day = date.getUTCDay();
//             const diffToMonday = day === 0 ? -6 : 1 - day;

//             startDate = new Date(date);
//             startDate.setUTCDate(date.getUTCDate() + diffToMonday);
//             startDate.setUTCHours(0, 0, 0, 0);

//             endDate = new Date(startDate);
//             endDate.setUTCDate(startDate.getUTCDate() + 6);
//             endDate.setUTCHours(23, 59, 59, 999);
//             break;

//         case "MONTHLY":
//             startDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0, 0));
//             endDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0, 23, 59, 59, 999));
//             break;

//         case "ONE_TIME":
//         default:
//             return null;
//     }

//     return { startDate, endDate };
// };

// // Get category breakdown
// const getCategoryBreakdown = async (query: any) => {
//     try {
//         const pipeline: mongoose.PipelineStage[] = [
//             { $match: query },
//             {
//                 $lookup: {
//                     from: "categories",
//                     localField: "scategory",
//                     foreignField: "_id",
//                     as: "categoryInfo",
//                 },
//             },
//             { $unwind: { path: "$categoryInfo", preserveNullAndEmptyArrays: true } },
//             {
//                 $group: {
//                     _id: {
//                         subCategoryId: "$scategory",
//                         subCategoryName: "$categoryInfo.name",
//                     },
//                     totalAmount: { $sum: { $toDouble: "$amount" } },
//                     transactionCount: { $sum: 1 },
//                 },
//             },
//             {
//                 $project: {
//                     subCategoryId: "$_id.subCategoryId",
//                     subCategoryName: "$_id.subCategoryName",
//                     totalAmount: 1,
//                     transactionCount: 1,
//                     _id: 0,
//                 },
//             },
//             { $sort: { totalAmount: -1 } },
//         ];

//         const breakdown = await Transaction.aggregate(pipeline);
//         return breakdown;
//     } catch (error) {
//         console.error("Error getting category breakdown:", error);
//         return [];
//     }
// };

// // Create budget entries for multiple spaces
// const createBudgetEntries = async (budget: any, startDate: Date, endDate: Date) => {
//     try {
//         // Create budget entry for each space
//         const entries = [];
        
//         for (const spaceId of budget.spaceIds) {
//             let initialSpent = 0;

//             const spaceIdObj = new Types.ObjectId(spaceId.toString());

//             const query: any = {
//                 userId: budget.userId,
//                 spaceId: spaceIdObj,
//                 date: {
//                     $gte: startDate,
//                     $lte: endDate
//                 }
//             };

//             let targetSubCategoryIds: mongoose.Types.ObjectId[] = [];

//             if (budget.subCategoryIds && budget.subCategoryIds.length > 0) {
//                 targetSubCategoryIds = budget.subCategoryIds.map(
//                     (id: any) => new mongoose.Types.ObjectId(id.toString())
//                 );
//                 query.scategory = { $in: targetSubCategoryIds };
//             } else if (budget.mainCategoryId) {
//                 const subCategories = await Category.find({
//                     parentCategoryId: new mongoose.Types.ObjectId(budget.mainCategoryId.toString()),
//                 });
//                 targetSubCategoryIds = subCategories.map(
//                     (subCat: any) => new mongoose.Types.ObjectId(subCat._id.toString())
//                 );

//                 if (targetSubCategoryIds.length > 0) {
//                     query.scategory = { $in: targetSubCategoryIds };
//                 }
//             }

//             // Get space type for this space 
//             const spaceIndex = budget.spaceIds.findIndex((id: any) => id.toString() === spaceId.toString());
//             const spaceType = spaceIndex !== -1 ? budget.spaceTypes[spaceIndex] : 'UNKNOWN';

//             switch (spaceType) {
//                 case "CASH":
//                 case "BANK":
//                     query.type = TransactionType.EXPENSE;
//                     break;
//                 case "CREDIT_CARD":
//                     query.type = TransactionType.BALANCE_INCREASE;
//                     break;
//                 default:
//                     query.type = TransactionType.EXPENSE;
//             }

//             const existingTransactions = await Transaction.find(query);

//             if (existingTransactions.length > 0) {
//                 initialSpent = existingTransactions.reduce((total, transaction) => {
//                     return total + convertAmountToNumber(transaction.amount);
//                 }, 0);

//                 console.log(`Found ${existingTransactions.length} existing transactions for budget period in space ${spaceId}. Initial spent: ${initialSpent}`);
//             }

//             const entry = await BudgetEntry.create({
//                 budget_id: budget._id,
//                 spaceId: spaceId,
//                 start_date: startDate,
//                 end_date: endDate,
//                 amount: budget.amount,
//                 spent: initialSpent
//             });

//             entries.push(entry);
//         }

//         return entries;
//     } catch (error) {
//         console.error("Error creating budget entries:", error);
//         throw error;
//     }
// };

// // Check and create new budget entries for recurring budgets
// const checkAndCreateNewEntries = async (userId: string) => {
//     try {
//         const today = new Date();
//         const isFirstDayOfMonth = today.getDate() === 1;
//         const isFirstDayOfWeekMonday = today.getDay() === 1;

//         const budgets = await Budget.find({ userId: userId });

//         for (const budget of budgets) {
//             if (budget.type === 'MONTHLY') {
//                 const lastApplied = new Date(budget.last_applied_date);
//                 if (lastApplied.getMonth() !== today.getMonth() ||
//                     lastApplied.getFullYear() !== today.getFullYear()) {

//                     const monthStart = getStartOfMonth(today);
//                     const monthEnd = getEndOfMonth(today);

//                     await createBudgetEntries(budget, monthStart, monthEnd);

//                     budget.last_applied_date = today;
//                     await budget.save();
//                 }
//             } else if (budget.type === 'WEEKLY') {
//                 const lastApplied = new Date(budget.last_applied_date);
//                 const lastAppliedStart = getStartOfWeek(lastApplied);
//                 const currentStart = getStartOfWeek(today);

//                 if (lastAppliedStart.getTime() !== currentStart.getTime()) {
//                     const weekStart = getStartOfWeek(today);
//                     const weekEnd = getEndOfWeek(today);

//                     await createBudgetEntries(budget, weekStart, weekEnd);

//                     budget.last_applied_date = today;
//                     await budget.save();
//                 }
//             }
//         }
//     } catch (error) {
//         console.error("Error checking and creating new entries:", error);
//     }
// };

// // Get current budget period entry for a specific space
// const getCurrentBudgetEntry = async (budgetId: string, spaceId: string, date: Date) => {
//     try {
//         if (!date || isNaN(date.getTime())) {
//             throw new Error("Invalid date provided");
//         }

//         const entry = await BudgetEntry.findOne({
//             budget_id: budgetId,
//             spaceId: spaceId,
//             start_date: { $lte: date },
//             end_date: { $gte: date }
//         }).sort({ start_date: -1 });

//         return entry;
//     } catch (error) {
//         console.error("Error getting current budget entry:", error);
//         return null;
//     }
// };

// // Get budget entries for a budget (for trend chart)
// const getBudgetEntries = async (budgetId: string, spaceId?: string, limit: number = 12) => {
//     try {
//         const filter: any = { budget_id: budgetId };
//         if (spaceId) {
//             filter.spaceId = spaceId;
//         }
        
//         const entries = await BudgetEntry.find(filter)
//             .sort({ start_date: -1 })
//             .limit(limit);

//         return entries;
//     } catch (error) {
//         console.error("Error getting budget entries:", error);
//         return [];
//     }
// };

// // Create a new budget
// budgetRouter.post("/", authenticate, async (req: Request, res: Response): Promise<void> => {
//     try {
//         const userId: string = (req as any).user.id;
//         const {
//             name,
//             amount,
//             type,
//             mainCategoryId,
//             subCategoryIds,
//             spaceIds,
//             spaceTypes,
//             isMultiSpace,
//             startDate,
//             endDate,
//         } = req.body;

//         // Validate spaceIds
//         if (!spaceIds || !Array.isArray(spaceIds) || spaceIds.length === 0) {
//             res.status(400).json({
//                 success: false,
//                 error: { message: "At least one space is required" },
//                 data: null,
//             });
//             return;
//         }

//         // Validate spaceTypes matches spaceIds
//         if (!spaceTypes || !Array.isArray(spaceTypes) || spaceTypes.length !== spaceIds.length) {
//             res.status(400).json({
//                 success: false,
//                 error: { message: "Space types must match the number of spaces" },
//                 data: null,
//             });
//             return;
//         }

//         let budgetStartDate: Date;
//         let budgetEndDate: Date;
//         let lastAppliedDate: Date;

//         if (type === "ONE_TIME") {
//             if (!startDate || !endDate) {
//                 res.status(400).json({
//                     success: false,
//                     error: {
//                         message:
//                             "Start date and end date are required for one-time budgets",
//                     },
//                     data: null,
//                 });
//                 return;
//             }
//             budgetStartDate = new Date(startDate);
//             budgetEndDate = new Date(endDate);
//             lastAppliedDate = new Date(startDate);
//         } else {
//             const calculatedDates = calculateBudgetDates(type, new Date());
//             if (!calculatedDates) {
//                 res.status(400).json({
//                     success: false,
//                     error: { message: "Invalid budget type" },
//                     data: null,
//                 });
//                 return;
//             }
//             budgetStartDate = calculatedDates.startDate;
//             budgetEndDate = calculatedDates.endDate;
//             lastAppliedDate = calculatedDates.startDate;
//         }

//         const budget = await Budget.create({
//             name,
//             amount,
//             type,
//             mainCategoryId,
//             subCategoryIds,
//             spaceIds,
//             spaceTypes,
//             isMultiSpace: spaceIds.length > 1,
//             startDate: budgetStartDate,
//             endDate: type === "ONE_TIME" ? budgetEndDate : undefined,
//             userId: userId,
//             last_applied_date: lastAppliedDate
//         });

//         await createBudgetEntries(budget, budgetStartDate, budgetEndDate);

//         res.status(201).json({
//             success: true,
//             data: {
//                 object: budget,
//                 message: "Budget created successfully",
//             },
//             error: null,
//         });
//     } catch (error) {
//         const errorMessage =
//             error instanceof Error ? error.message : "Unknown error";
//         res.status(500).json({
//             success: false,
//             error: { message: "Error creating budget: " + errorMessage },
//             data: null,
//         });
//     }
// });

// // Update a budget amount
// budgetRouter.put("/:id", authenticate, async (req: Request, res: Response): Promise<void> => {
//     try {
//         const { id } = req.params;
//         const userId: string = (req as any).user.id;
//         const {
//             amount,
//             updateScope
//         } = req.body;

//         // Validate amount
//         if (amount === undefined || amount <= 0) {
//             res.status(400).json({
//                 success: false,
//                 error: { message: "Valid amount is required" },
//                 data: null,
//             });
//             return;
//         }

//         if (!updateScope || !['current', 'future', 'all'].includes(updateScope)) {
//             res.status(400).json({
//                 success: false,
//                 error: { message: "Valid update scope is required (current, future, or all)" },
//                 data: null,
//             });
//             return;
//         }

//         const existingBudget = await Budget.findOne({ _id: id, userId: userId });

//         if (!existingBudget) {
//             res.status(404).json({
//                 success: false,
//                 error: { message: "Budget not found" },
//                 data: null,
//             });
//             return;
//         }

//         const today = new Date();

//         switch (updateScope) {
//             case 'current':
//                 // Update current entries for all spaces in the budget
//                 for (const spaceId of existingBudget.spaceIds) {
//                     const currentEntry = await getCurrentBudgetEntry(id, spaceId.toString(), today);
//                     if (currentEntry) {
//                         currentEntry.amount = amount;
//                         await currentEntry.save();
//                     } else {
//                         // If no current entry exists for a recurring budget, create one
//                         if (existingBudget.type !== 'ONE_TIME') {
//                             const calculatedDates = calculateBudgetDates(existingBudget.type, today);
//                             if (calculatedDates) {
//                                 // Create entry for this space
//                                 await BudgetEntry.create({
//                                     budget_id: existingBudget._id,
//                                     spaceId: spaceId,
//                                     start_date: calculatedDates.startDate,
//                                     end_date: calculatedDates.endDate,
//                                     amount: amount,
//                                     spent: 0
//                                 });
//                                 console.log(`Created new entry for current period with amount ${amount} for space ${spaceId}`);
//                             }
//                         }
//                     }
//                 }
//                 break;

//             case 'future':
//                 existingBudget.amount = amount;
//                 await existingBudget.save();

//                 // Update current and future entries for all spaces
//                 for (const spaceId of existingBudget.spaceIds) {
//                     const currentEntry = await getCurrentBudgetEntry(id, spaceId.toString(), today);
//                     if (currentEntry) {
//                         currentEntry.amount = amount;
//                         await currentEntry.save();
//                     } else {
//                         if (existingBudget.type !== 'ONE_TIME') {
//                             const calculatedDates = calculateBudgetDates(existingBudget.type, today);
//                             if (calculatedDates) {
//                                 await BudgetEntry.create({
//                                     budget_id: existingBudget._id,
//                                     spaceId: spaceId,
//                                     start_date: calculatedDates.startDate,
//                                     end_date: calculatedDates.endDate,
//                                     amount: amount,
//                                     spent: 0
//                                 });
//                             }
//                         }
//                     }

//                     // Update future entries for this space
//                     await BudgetEntry.updateMany(
//                         {
//                             budget_id: id,
//                             spaceId: spaceId,
//                             start_date: { $gt: today }
//                         },
//                         { $set: { amount: amount } }
//                     );
//                 }
//                 break;

//             case 'all':
//                 existingBudget.amount = amount;
//                 await existingBudget.save();

//                 // Update all entries for all spaces
//                 await BudgetEntry.updateMany(
//                     { budget_id: id },
//                     { $set: { amount: amount } }
//                 );
//                 break;

//             default:
//                 res.status(400).json({
//                     success: false,
//                     error: { message: "Invalid update scope" },
//                     data: null,
//                 });
//                 return;
//         }

//         res.status(200).json({
//             success: true,
//             data: {
//                 message: "Budget amount updated successfully!",
//                 updateScope: updateScope,
//                 newAmount: amount
//             },
//             error: null,
//         });
//     } catch (error) {
//         const errorMessage =
//             error instanceof Error ? error.message : "Unknown error";
//         res.status(500).json({
//             success: false,
//             error: { message: "Error updating budget: " + errorMessage },
//             data: null,
//         });
//     }
// });

// // Delete a budget and all its entries
// budgetRouter.delete("/:id", authenticate, async (req: Request, res: Response): Promise<void> => {
//     try {
//         const { id } = req.params;
//         const userId: string = (req as any).user.id;

//         const existingBudget = await Budget.findOne({ _id: id, userId: userId });

//         if (!existingBudget) {
//             res.status(404).json({
//                 success: false,
//                 error: { message: "Budget not found" },
//                 data: null,
//             });
//             return;
//         }

//         await BudgetEntry.deleteMany({ budget_id: id });
//         await Budget.deleteOne({ _id: id });

//         res.status(200).json({
//             success: true,
//             data: {
//                 message: "Budget deleted successfully",
//             },
//             error: null,
//         });
//     } catch (error) {
//         const errorMessage =
//             error instanceof Error ? error.message : "Unknown error";
//         res.status(500).json({
//             success: false,
//             error: { message: "Error deleting budget: " + errorMessage },
//             data: null,
//         });
//     }
// });

// // Get budgets with automatic entry creation
// budgetRouter.get("/", authenticate, async (req: Request, res: Response): Promise<void> => {
//     try {
//         const userId: string = (req as any).user.id;

//         await checkAndCreateNewEntries(userId);

//         const budgets = await Budget.find({ userId: userId }).sort({
//             createdAt: -1,
//         });

//         res.status(200).json({
//             success: true,
//             data: {
//                 object: budgets,
//                 message: "Budgets retrieved successfully!",
//             },
//             error: null,
//         });
//     } catch (error) {
//         const errorMessage =
//             error instanceof Error ? error.message : "Unknown error";
//         res.status(500).json({
//             success: false,
//             error: { message: "Error finding budgets: " + errorMessage },
//             data: null,
//         });
//     }
// });

// // Get budgets by space ID
// budgetRouter.get("/space/:spaceId", authenticate, async (req: Request, res: Response): Promise<void> => {
//     try {
//         const userId: string = (req as any).user.id;
//         const { spaceId } = req.params;

//         await checkAndCreateNewEntries(userId);

//         // Find budgets that include this spaceId in their spaceIds array
//         const spaceIdObj = new Types.ObjectId(spaceId);
//         const budgets = await Budget.find({
//             userId: userId,
//             spaceIds: spaceIdObj
//         }).sort({ createdAt: -1 });

//         res.status(200).json({
//             success: true,
//             data: {
//                 object: budgets,
//                 message: "Budgets retrieved successfully!",
//             },
//             error: null,
//         });
//     } catch (error) {
//         const errorMessage =
//             error instanceof Error ? error.message : "Unknown error";
//         res.status(500).json({
//             success: false,
//             error: { message: "Error finding budgets: " + errorMessage },
//             data: null,
//         });
//     }
// });

// // Get budgets by space type
// budgetRouter.get("/space-type/:spaceType", authenticate, async (req: Request, res: Response): Promise<void> => {
//     try {
//         const userId: string = (req as any).user.id;
//         const { spaceType } = req.params;

//         await checkAndCreateNewEntries(userId); 


//         // Find budgets that have this spaceType in their spaceTypes array
//         const budgets = await Budget.find({
//             userId: userId,
//             spaceTypes: spaceType
//         }).sort({ createdAt: -1 });

//         res.status(200).json({
//             success: true,
//             data: {
//                 object: budgets,
//                 message: "Budgets retrieved successfully!",
//             },
//             error: null,
//         });
//     } catch (error) {
//         const errorMessage =
//             error instanceof Error ? error.message : "Unknown error";
//         res.status(500).json({
//             success: false,
//             error: { message: "Error finding budgets: " + errorMessage },
//             data: null,
//         });
//     }
// });

// // Get budget spending with entries
// budgetRouter.get("/:id/spending", authenticate, async (req: Request, res: Response): Promise<void> => {
//     try {
//         const { id } = req.params;
//         const userId: string = (req as any).user.id;
//         const { date, spaceId } = req.query;

//         // Validate date parameter
//         let targetDate: Date;
//         if (date) {
//             targetDate = new Date(date as string);
//             if (isNaN(targetDate.getTime())) {
//                 res.status(400).json({
//                     success: false,
//                     error: { message: "Invalid date format" },
//                     data: null,
//                 });
//                 return;
//             }
//         } else {
//             targetDate = new Date();
//         }

//         const budget = await Budget.findOne({ _id: id, userId: userId });

//         if (!budget) {
//             res.status(404).json({
//                 success: false,
//                 error: { message: "Budget not found" },
//                 data: null,
//             });
//             return;
//         }

//         // If spaceId is provided, use it. Otherwise, use the first space in the budget
//         // This allows the frontend to specify which space's spending to display
//         const targetSpaceId = spaceId ? spaceId as string : budget.spaceIds[0].toString();

//         // Validate that the target space is part of this budget
//         if (!budget.spaceIds.some((id: any) => id.toString() === targetSpaceId)) {
//             res.status(400).json({
//                 success: false,
//                 error: { message: "Specified space is not part of this budget" },
//                 data: null,
//             });
//             return;
//         }


//         // Get the current budget entry for the target date and space
//         const currentEntry = await getCurrentBudgetEntry(id, targetSpaceId, targetDate);

//         if (!currentEntry) {
//             // Check if this is a ONE_TIME budget with future dates
//             if (budget.type === 'ONE_TIME') {
//                 const today = new Date();
//                 const budgetStart = budget.startDate ? new Date(budget.startDate) : null;

//                 // If budget hasn't started yet, return empty data
//                 if (budgetStart && today < budgetStart) {
//                     const emptySpendingData = {
//                         budgetId: budget._id,
//                         budgetName: budget.name,
//                         budgetAmount: budget.amount,
//                         totalSpent: 0,
//                         remainingAmount: budget.amount,
//                         percentage: 0,
//                         overBudgetAmount: 0,
//                         isOverBudget: false,
//                         dailySpending: [],
//                         categoryBreakdown: [],
//                         startDate: budget.startDate,
//                         endDate: budget.endDate,
//                         budgetType: budget.type,
//                         totalTransactions: 0,
//                         trendData: [],
//                         currentEntry: null,
//                         spaceId: targetSpaceId
//                     };

//                     res.status(200).json({
//                         success: true,
//                         data: {
//                             object: emptySpendingData,
//                             message: "Budget hasn't started yet - no spending data",
//                         },
//                         error: null,
//                     });
//                     return;
//                 }
//             }

//             res.status(404).json({
//                 success: false,
//                 error: { message: "No budget entry found for this date period" },
//                 data: null,
//             });
//             return;
//         }

//         const allEntries = await getBudgetEntries(id, targetSpaceId as string, budget.type === 'ONE_TIME' ? 0 : 12);

//         const query: any = {
//             userId: new Types.ObjectId(userId),
//             spaceId: new Types.ObjectId(targetSpaceId),
//             date: {
//                 $gte: currentEntry.start_date,
//                 $lte: currentEntry.end_date,
//             },
//         };

//         let targetSubCategoryIds: Types.ObjectId[] = [];
//         if (budget.subCategoryIds && budget.subCategoryIds.length > 0) {
//             targetSubCategoryIds = budget.subCategoryIds.map(
//                 (id: any) => new Types.ObjectId(id.toString())
//             );
//         } else {
//             const subCategories = await Category.find({
//                 parentCategoryId: new Types.ObjectId(budget.mainCategoryId.toString()),
//             });
//             targetSubCategoryIds = subCategories.map(
//                 (subCat: any) => new Types.ObjectId(subCat._id.toString())
//             );
//         }

//         if (targetSubCategoryIds.length > 0) {
//             query.scategory = { $in: targetSubCategoryIds };
//         }

//         // Get space type for query
//         const spaceIndex = budget.spaceIds.findIndex((id: any) => id.toString() === targetSpaceId);
//         const spaceType = spaceIndex !== -1 ? budget.spaceTypes[spaceIndex] : 'UNKNOWN';

//         switch (spaceType) {
//             case "CASH":
//             case "BANK":
//                 query.type = TransactionType.EXPENSE;
//                 break;
//             case "CREDIT_CARD":
//                 query.type = TransactionType.BALANCE_INCREASE;
//                 break;
//             default:
//                 query.type = TransactionType.EXPENSE;
//         }

//         const transactions = await Transaction.find(query).sort({ date: 1 });

//         let totalSpent = 0;
//         const dailySpending: { date: string; amount: number }[] = [];
//         const spendingByDate = new Map<string, number>();

//         transactions.forEach((transaction) => {
//             const amount = convertAmountToNumber(transaction.amount);
//             totalSpent += amount;

//             const dateObj = new Date(transaction.date.toString());
//             const dateStr = dateObj.toISOString().split("T")[0];

//             spendingByDate.set(dateStr, (spendingByDate.get(dateStr) || 0) + amount);
//         });

//         spendingByDate.forEach((amount, date) => {
//             dailySpending.push({ date, amount });
//         });

//         dailySpending.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

//         const budgetAmount = currentEntry.amount;
//         const remainingAmount = Math.max(0, budgetAmount - totalSpent);
//         const percentage = budgetAmount > 0 ? (totalSpent / budgetAmount) * 100 : 0;
//         const isOverBudget = totalSpent > budgetAmount;
//         const overBudgetAmount = Math.max(0, totalSpent - budgetAmount);

//         const categoryBreakdown = await getCategoryBreakdown(query);

//         const trendData = allEntries.map(entry => ({
//             period: entry.start_date,
//             amount: entry.amount,
//             spent: entry.spent || 0,
//             start_date: entry.start_date,
//             end_date: entry.end_date
//         }));

//         const spendingData = {
//             budgetId: budget._id,
//             budgetName: budget.name,
//             budgetAmount,
//             totalSpent,
//             remainingAmount,
//             percentage: Math.min(percentage, 100),
//             overBudgetAmount,
//             isOverBudget,
//             dailySpending,
//             categoryBreakdown,
//             startDate: currentEntry.start_date,
//             endDate: currentEntry.end_date,
//             budgetType: budget.type,
//             totalTransactions: transactions.length,
//             trendData: allEntries,
//             currentEntry: {
//                 id: currentEntry._id,
//                 amount: currentEntry.amount,
//                 spent: currentEntry.spent,
//                 start_date: currentEntry.start_date,
//                 end_date: currentEntry.end_date,
//                 spaceId: currentEntry.spaceId
//             },
//             spaceId: targetSpaceId
//         };

//         res.status(200).json({
//             success: true,
//             data: {
//                 object: spendingData,
//                 message: "Budget spending retrieved successfully!",
//             },
//             error: null,
//         });
//     } catch (error) {
//         const errorMessage =
//             error instanceof Error ? error.message : "Unknown error";
//         console.error("Error calculating budget spending:", error);
//         res.status(500).json({
//             success: false,
//             error: {
//                 message: "Error calculating budget spending: " + errorMessage,
//             },
//             data: null,
//         });
//     }
// });

// budgetRouter.post("/:id/update-spent", authenticate, async (req: Request, res: Response): Promise<void> => {
//     try {
//         const { id } = req.params;
//         const userId: string = (req as any).user.id;
//         const {
//             transactionDate,
//             amount,
//             isEdit = false,
//             oldAmount = 0,
//             spaceId
//         } = req.body;

//         console.log("update-spent called with:", {
//             budgetId: id,
//             userId,
//             transactionDate,
//             amount,
//             isEdit,
//             oldAmount,
//             spaceId
//         });

//         // Validate required fields
//         if (!transactionDate || amount === undefined || !spaceId) {
//             res.status(400).json({
//                 success: false,
//                 error: { message: "Transaction date, amount, and space ID are required" },
//                 data: null,
//             });
//             return;
//         }

//         // Validate transaction date
//         const targetDate = new Date(transactionDate);
//         if (isNaN(targetDate.getTime())) {
//             res.status(400).json({
//                 success: false,
//                 error: { message: "Invalid transaction date format" },
//                 data: null,
//             });
//             return;
//         }

//         // Convert amount and oldAmount to numbers
//         const transactionAmount = convertAmountToNumber(amount);
//         const oldTransactionAmount = convertAmountToNumber(oldAmount);

//         console.log("Converted amounts:", {
//             transactionAmount,
//             oldTransactionAmount,
//             isEdit
//         });

//         // Find the budget with user validation
//         const budget = await Budget.findOne({
//             _id: id,
//             userId: userId
//         });

//         if (!budget) {
//             res.status(404).json({
//                 success: false,
//                 error: { message: "Budget not found" },
//                 data: null,
//             });
//             return;
//         }

//         // Validate that transaction space ID is in budget's spaceIds
//         const budgetSpaceIdsAsStrings = budget.spaceIds.map((id: any) => id.toString());
//         if (!budgetSpaceIdsAsStrings.includes(spaceId)) {
//             console.log("Space ID not found in budget:", {
//                 budgetSpaceIds: budgetSpaceIdsAsStrings,
//                 transactionSpaceId: spaceId
//             });
//             res.status(400).json({
//                 success: false,
//                 error: {
//                     message: "Transaction space ID is not part of this budget"
//                 },
//                 data: null,
//             });
//             return;
//         }
        
//         // Find the budget entry for the transaction date and space
//         const budgetEntry = await BudgetEntry.findOne({
//             budget_id: id,
//             spaceId: spaceId,
//             start_date: { $lte: targetDate },
//             end_date: { $gte: targetDate }
//         });

//         if (!budgetEntry) {
//             const anyEntry = await BudgetEntry.findOne({ budget_id: id, spaceId: spaceId });
//             if (!anyEntry) {
//                 console.log("No budget entries found for this budget and space");
//                 res.status(404).json({
//                     success: false,
//                     error: {
//                         message: "No budget entries found for this budget and space"
//                     },
//                     data: null,
//                 });
//             } else {
//                 console.log("Transaction date outside budget entry range", {
//                     transactionDate: targetDate.toISOString(),
//                     entryStart: anyEntry.start_date.toISOString(),
//                     entryEnd: anyEntry.end_date.toISOString()
//                 });
//                 res.status(404).json({
//                     success: false,
//                     error: {
//                         message: `No budget entry found for transaction date: ${targetDate.toISOString()}. ` +
//                             `Budget entries exist from ${anyEntry.start_date.toISOString()} to ${anyEntry.end_date.toISOString()}`
//                     },
//                     data: null,
//                 });
//             }
//             return;
//         }

//         // Double-check transaction date is within budget entry date range
//         if (targetDate < budgetEntry.start_date || targetDate > budgetEntry.end_date) {
//             res.status(400).json({
//                 success: false,
//                 error: {
//                     message: `Transaction date ${targetDate.toISOString()} is outside the budget entry period ` +
//                         `(${budgetEntry.start_date.toISOString()} to ${budgetEntry.end_date.toISOString()})`
//                 },
//                 data: null,
//             });
//             return;
//         }

//         // Update spent amount with validation
//         const currentSpent = budgetEntry.spent || 0;
//         let newSpent: number;

//         if (isEdit) {
//             const difference = transactionAmount - oldTransactionAmount;
//             newSpent = currentSpent + difference;
//             console.log(`Edit operation: oldAmount=${oldTransactionAmount}, newAmount=${transactionAmount}, difference=${difference}, oldSpent=${currentSpent}, newSpent=${newSpent}`);

//             if (newSpent < 0) {
//                 console.warn(`Warning: Spent amount would go negative (${newSpent}). Setting to 0.`);
//                 newSpent = 0;
//             }

//         } else {
//             // New transaction or delete: add amount (could be negative for deletions)
//             newSpent = currentSpent + transactionAmount;
//             console.log(`${transactionAmount >= 0 ? 'Create' : 'Delete'} operation: amount=${transactionAmount}, oldSpent=${currentSpent}, newSpent=${newSpent}`);

//             if (newSpent < 0) {
//                 console.warn(`Warning: Spent amount would go negative (${newSpent}). Setting to 0.`);
//                 newSpent = 0;
//             }
//         }

//         // Ensure spent doesn't go negative
//         newSpent = Math.max(0, newSpent);
//         budgetEntry.spent = newSpent;

//         await budgetEntry.save();

//         console.log(`Successfully updated budget entry ${budgetEntry._id} for budget ${id} and space ${spaceId}. ` +
//             `Transaction amount: ${transactionAmount}, Old spent: ${currentSpent}, New spent: ${newSpent}`);

//         res.status(200).json({
//             success: true,
//             data: {
//                 message: "Budget spent amount updated successfully",
//                 newSpent: budgetEntry.spent,
//                 budgetEntryId: budgetEntry._id,
//                 period: {
//                     start: budgetEntry.start_date,
//                     end: budgetEntry.end_date
//                 },
//                 budgetId: budget._id,
//                 budgetName: budget.name,
//                 spaceId: spaceId,
//                 operation: isEdit ? 'edit' : (transactionAmount >= 0 ? 'create' : 'delete'),
//                 oldAmount: oldTransactionAmount,
//                 newAmount: transactionAmount
//             },
//             error: null,
//         });
//     } catch (error) {
//         const errorMessage =
//             error instanceof Error ? error.message : "Unknown error";
//         console.error("Error updating budget spent:", error);
//         res.status(500).json({
//             success: false,
//             error: {
//                 message: "Error updating budget spent: " + errorMessage,
//                 details: error instanceof Error ? error.stack : 'No stack trace'
//             },
//             data: null,
//         });
//     }
// });

// export default budgetRouter;


import express, { Request, Response } from "express";
import Budget from "../models/budget";
import BudgetEntry from "../models/budget-entry";
import { authenticate } from "../middlewares/auth";
import Transaction, { TransactionType } from "../models/transaction";
import Category from "../models/category";
import Space from "../models/space";
import mongoose, { Types } from "mongoose";
import { createNotification, NotificationType } from "../services/notification.service";

const budgetRouter = express.Router();

// Helper function to safely convert amount to number
const convertAmountToNumber = (amount: any): number => {
    if (typeof amount === "number") {
        return amount;
    } else if (typeof amount === "string") {
        return parseFloat(amount);
    } else if (amount && typeof amount === "object" && "toString" in amount) {
        return parseFloat(amount.toString());
    }
    return 0;
};

const getStartOfDay = (date: Date): Date => {
    const start = new Date(date);
    start.setUTCHours(0, 0, 0, 0);
    return start;
};

const getEndOfDay = (date: Date): Date => {
    const end = new Date(date);
    end.setUTCHours(23, 59, 59, 999);
    return end;
};

// function to get start of week (Monday)
const getStartOfWeek = (date: Date): Date => {
    const day = date.getUTCDay();
    const diff = date.getUTCDate() - day + (day === 0 ? -6 : 1);
    const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), diff));
    return getStartOfDay(start);
};

// function to get end of week (Sunday)
const getEndOfWeek = (date: Date): Date => {
    const start = getStartOfWeek(new Date(date));
    const end = new Date(start);
    end.setUTCDate(start.getUTCDate() + 6);
    return getEndOfDay(end);
};

// function to get start of month (1st day)
const getStartOfMonth = (date: Date): Date => {
    const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
    return getStartOfDay(start);
};

// function to get end of month (last day)
const getEndOfMonth = (date: Date): Date => {
    const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
    return getEndOfDay(end);
};

// function to calculate budget dates based on type
const calculateBudgetDates = (type: string, baseDate: Date = new Date()): { startDate: Date; endDate: Date } | null => {
    let startDate: Date;
    let endDate: Date;

    const date = new Date(baseDate.toISOString());

    switch (type) {
        case "WEEKLY":
            const day = date.getUTCDay();
            const diffToMonday = day === 0 ? -6 : 1 - day;

            startDate = new Date(date);
            startDate.setUTCDate(date.getUTCDate() + diffToMonday);
            startDate.setUTCHours(0, 0, 0, 0);

            endDate = new Date(startDate);
            endDate.setUTCDate(startDate.getUTCDate() + 6);
            endDate.setUTCHours(23, 59, 59, 999);
            break;

        case "MONTHLY":
            startDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0, 0));
            endDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0, 23, 59, 59, 999));
            break;

        case "ONE_TIME":
        default:
            return null;
    }

    return { startDate, endDate };
};

// Get category breakdown
const getCategoryBreakdown = async (query: any) => {
    try {
        const pipeline: mongoose.PipelineStage[] = [
            { $match: query },
            {
                $lookup: {
                    from: "categories",
                    localField: "scategory",
                    foreignField: "subCategories._id",
                    as: "categoryInfo",
                },
            },
            { $unwind: { path: "$categoryInfo", preserveNullAndEmptyArrays: true } },
            {
                $addFields: {
                    subCategory: {
                        $filter: {
                            input: "$categoryInfo.subCategories",
                            as: "subCat",
                            cond: { $eq: ["$$subCat._id", "$scategory"] }
                        }
                    }
                }
            },
            { $unwind: { path: "$subCategory", preserveNullAndEmptyArrays: true } },
            {
                $group: {
                    _id: {
                        subCategoryId: "$scategory",
                        subCategoryName: "$subCategory.name",
                        mainCategoryId: "$categoryInfo._id",
                        mainCategoryName: "$categoryInfo.parentCategory",
                        mainCategoryColor: "$categoryInfo.color",
                    },
                    totalAmount: { $sum: { $toDouble: "$amount" } },
                    transactionCount: { $sum: 1 },
                },
            },
            {
                $project: {
                    subCategoryId: "$_id.subCategoryId",
                    subCategoryName: "$_id.subCategoryName",
                    mainCategoryId: "$_id.mainCategoryId",
                    mainCategoryName: "$_id.mainCategoryName",
                    mainCategoryColor: "$_id.mainCategoryColor",
                    totalAmount: 1,
                    transactionCount: 1,
                    _id: 0,
                },
            },
            { $sort: { totalAmount: -1 } },
        ];

        const breakdown = await Transaction.aggregate(pipeline);
        return breakdown;
    } catch (error) {
        console.error("Error getting category breakdown:", error);
        return [];
    }
};

// Helper Function to check if user has access to space
const canAccessSpace = async (userId: string, spaceId: string): Promise<boolean> => {
    try {
        const space = await Space.findOne({
            _id: spaceId,
            $or: [
                { ownerId: userId },
                { "collaborators.userId": userId, "collaborators.status": "ACCEPTED" }
            ]
        });
        return !!space;
    } catch (error) {
        console.error("Error checking space access:", error);
        return false;
    }
};

// Helper function to check if user is creator of budget
const isBudgetCreator = async (budgetId: string, userId: string): Promise<boolean> => {
    try {
        const budget = await Budget.findOne({
            _id: budgetId,
            createdBy: userId
        });
        return !!budget;
    } catch (error) {
        console.error("Error checking budget creator:", error);
        return false;
    }
};

// Create a single budget entry for all spaces combined
const createBudgetEntry = async (budget: any, startDate: Date, endDate: Date) => {
    try {
        let initialSpent = 0;

        // Query transactions from ALL spaces in the budget
        const query: any = {
            userId: budget.userId,
            date: {
                $gte: startDate,
                $lte: endDate
            }
        };

        // Add space filter - match any space in the budget's spaceIds
        if (budget.spaceIds && budget.spaceIds.length > 0) {
            query.spaceId = {
                $in: budget.spaceIds.map((id: any) => new Types.ObjectId(id.toString()))
            };
        }

        // Determine transaction types based on space types
        // For multi-space budgets, we need to include both EXPENSE and BALANCE_INCREASE
        // based on the space types in the budget
        const transactionTypes: TransactionType[] = [];

        budget.spaceTypes.forEach((spaceType: string) => {
            if (spaceType === "CASH" || spaceType === "BANK") {
                if (!transactionTypes.includes(TransactionType.EXPENSE)) {
                    transactionTypes.push(TransactionType.EXPENSE);
                }
            } else if (spaceType === "CREDIT_CARD") {
                if (!transactionTypes.includes(TransactionType.BALANCE_INCREASE)) {
                    transactionTypes.push(TransactionType.BALANCE_INCREASE);
                }
            }
        });

        if (transactionTypes.length > 0) {
            query.type = { $in: transactionTypes };
        }

        let targetSubCategoryIds: mongoose.Types.ObjectId[] = [];

        if (budget.subCategoryIds && budget.subCategoryIds.length > 0) {
            targetSubCategoryIds = budget.subCategoryIds.map(
                (id: any) => new mongoose.Types.ObjectId(id.toString())
            );
            query.scategory = { $in: targetSubCategoryIds };
        } else if (budget.mainCategoryId) {
            const category = await Category.findById(budget.mainCategoryId);
            if (category && category.subCategories && category.subCategories.length > 0) {
                targetSubCategoryIds = category.subCategories.map(
                    (subCat: any) => new mongoose.Types.ObjectId(subCat._id.toString())
                );

                if (targetSubCategoryIds.length > 0) {
                    query.scategory = { $in: targetSubCategoryIds };
                }
            }
        }

        const existingTransactions = await Transaction.find(query);

        if (existingTransactions.length > 0) {
            initialSpent = existingTransactions.reduce((total, transaction) => {
                return total + convertAmountToNumber(transaction.amount);
            }, 0);

            console.log(`Found ${existingTransactions.length} existing transactions across ${budget.spaceIds.length} spaces for budget period. Initial spent: ${initialSpent}`);
        }

        // Create ONE entry for the budget, not separate entries per space
        const entry = await BudgetEntry.create({
            budget_id: budget._id,
            spaceIds: budget.spaceIds,
            start_date: startDate,
            end_date: endDate,
            amount: budget.amount,
            spent: initialSpent
        });

        return [entry]; // Return as array for backward compatibility
    } catch (error) {
        console.error("Error creating budget entry:", error);
        throw error;
    }
};

// Check and create new budget entries for recurring budgets
const checkAndCreateNewEntries = async (userId: string) => {
    try {
        const today = new Date();
        const isFirstDayOfMonth = today.getDate() === 1;
        const isFirstDayOfWeekMonday = today.getDay() === 1;

        const budgets = await Budget.find({ userId: userId });

        for (const budget of budgets) {
            if (budget.type === 'MONTHLY' && isFirstDayOfMonth) {
                const lastApplied = new Date(budget.last_applied_date);
                if (lastApplied.getMonth() !== today.getMonth() ||
                    lastApplied.getFullYear() !== today.getFullYear()) {

                    const monthStart = getStartOfMonth(today);
                    const monthEnd = getEndOfMonth(today);

                    await createBudgetEntry(budget, monthStart, monthEnd);

                    budget.last_applied_date = today;
                    await budget.save();
                }
            } else if (budget.type === 'WEEKLY' && isFirstDayOfWeekMonday) {
                const lastApplied = new Date(budget.last_applied_date);
                const lastAppliedStart = getStartOfWeek(lastApplied);
                const currentStart = getStartOfWeek(today);

                if (lastAppliedStart.getTime() !== currentStart.getTime()) {
                    const weekStart = getStartOfWeek(today);
                    const weekEnd = getEndOfWeek(today);

                    await createBudgetEntry(budget, weekStart, weekEnd);

                    budget.last_applied_date = today;
                    await budget.save();
                }
            }
        }
    } catch (error) {
        console.error("Error checking and creating new entries:", error);
    }
};

// Get current budget period entry
const getCurrentBudgetEntry = async (budgetId: string, date: Date) => {
    try {
        if (!date || isNaN(date.getTime())) {
            throw new Error("Invalid date provided");
        }

        const entry = await BudgetEntry.findOne({
            budget_id: budgetId,
            start_date: { $lte: date },
            end_date: { $gte: date }
        }).sort({ start_date: -1 });

        return entry;
    } catch (error) {
        console.error("Error getting current budget entry:", error);
        return null;
    }
};

// Get budget entries for a budget
const getBudgetEntries = async (budgetId: string, limit: number = 12) => {
    try {
        const entries = await BudgetEntry.find({ budget_id: budgetId })
            .sort({ start_date: -1 })
            .limit(limit);

        return entries;
    } catch (error) {
        console.error("Error getting budget entries:", error);
        return [];
    }
};


// Get transaction details for a specific budget period 
const getTransactionDetailsForPeriod = async (
    budgetId: string,
    startDate: Date,
    endDate: Date,
    userId: string,
    spaceIds: Types.ObjectId[],
    subCategoryIds: Types.ObjectId[],
    spaceTypes: string[]
) => {
    try {
        // Build transaction query
        const query: any = {
            userId: new Types.ObjectId(userId),
            date: {
                $gte: startDate,
                $lte: endDate,
            },
        };

        // Add space filter
        if (spaceIds && spaceIds.length > 0) {
            query.spaceId = { $in: spaceIds };
        }

        // Determine transaction types based on space types
        const transactionTypes: TransactionType[] = [];
        spaceTypes.forEach((spaceType: string) => {
            if (spaceType === "CASH" || spaceType === "BANK") {
                if (!transactionTypes.includes(TransactionType.EXPENSE)) {
                    transactionTypes.push(TransactionType.EXPENSE);
                }
            } else if (spaceType === "CREDIT_CARD") {
                if (!transactionTypes.includes(TransactionType.BALANCE_INCREASE)) {
                    transactionTypes.push(TransactionType.BALANCE_INCREASE);
                }
            }
        });

        if (transactionTypes.length > 0) {
            query.type = { $in: transactionTypes };
        }

        // Add subcategory filter
        if (subCategoryIds && subCategoryIds.length > 0) {
            query.scategory = { $in: subCategoryIds };
        }

        // Fetch transactions with populated category info
        const transactions = await Transaction.find(query)
            .sort({ date: 1 })
            .populate({
                path: "spaceId",
                select: "name type"
            })
            .lean();

        // Get category information separately since scategory is just an ObjectId
        const categoryIds = transactions
            .map(t => t.scategory)
            .filter((id): id is NonNullable<typeof id> => id !== null && id !== undefined);

        const categories = await Category.find({
            "subCategories._id": { $in: categoryIds }
        }).lean();

        // Create a map for quick category lookup
        const categoryMap = new Map();
        categories.forEach(cat => {
            if (cat.subCategories && Array.isArray(cat.subCategories)) {
                cat.subCategories.forEach((subCat: any) => {
                    if (subCat._id) {
                        categoryMap.set(subCat._id.toString(), {
                            mainCategoryId: cat._id,
                            mainCategoryName: cat.parentCategory,
                            mainCategoryColor: cat.color,
                            subCategoryId: subCat._id,
                            subCategoryName: subCat.name,
                            subCategoryColor: subCat.color
                        });
                    }
                });
            }
        });

        // Format transaction details
        const transactionDetails = transactions.map(t => {
            const categoryInfo = categoryMap.get(t.scategory?.toString()) || {
                mainCategoryId: null,
                mainCategoryName: "Unknown",
                mainCategoryColor: "#6B7280",
                subCategoryId: t.scategory,
                subCategoryName: "Unknown",
                subCategoryColor: "#6B7280"
            };

            // Handle space population correctly
            let spaceInfo = {
                id: t.spaceId,
                name: "Unknown",
                type: "Unknown"
            };

            if (t.spaceId && typeof t.spaceId === 'object' && '_id' in t.spaceId) {
                spaceInfo = {
                    id: (t.spaceId as any)._id,
                    name: (t.spaceId as any).name || "Unknown",
                    type: (t.spaceId as any).type || "Unknown"
                };
            }

            return {
                id: t._id,
                amount: convertAmountToNumber(t.amount),
                date: t.date,
                note: t.note,
                type: t.type,
                category: {
                    id: categoryInfo.subCategoryId,
                    name: categoryInfo.subCategoryName,
                    color: categoryInfo.subCategoryColor,
                    mainCategory: {
                        id: categoryInfo.mainCategoryId,
                        name: categoryInfo.mainCategoryName,
                        color: categoryInfo.mainCategoryColor
                    }
                },
                space: spaceInfo
            };
        });

        return transactionDetails;
    } catch (error) {
        console.error("Error getting transaction details for period:", error);
        return [];
    }
};

// Create a new budget - creates ONE entry for all spaces
budgetRouter.post("/", authenticate, async (req: Request, res: Response): Promise<void> => {
    try {
        const userId: string = (req as any).user.id;
        const {
            name,
            amount,
            type,
            mainCategoryId,
            subCategoryIds,
            spaceIds,
            spaceTypes,
            isMultiSpace,
            startDate,
            endDate,
        } = req.body;

        // Validate spaceIds
        if (!spaceIds || !Array.isArray(spaceIds) || spaceIds.length === 0) {
            res.status(400).json({
                success: false,
                error: { message: "At least one space is required" },
                data: null,
            });
            return;
        }

        // Validate spaceTypes matches spaceIds
        if (!spaceTypes || !Array.isArray(spaceTypes) || spaceTypes.length !== spaceIds.length) {
            res.status(400).json({
                success: false,
                error: { message: "Space types must match the number of spaces" },
                data: null,
            });
            return;
        }

        // Verify user has access to all selected spaces
        for (const spaceId of spaceIds) {
            const hasAccess = await canAccessSpace(userId, spaceId);
            if (!hasAccess) {
                res.status(403).json({
                    success: false,
                    error: { message: `You don't have access to space: ${spaceId}` },
                    data: null,
                });
                return;
            }
        }

        let budgetStartDate: Date;
        let budgetEndDate: Date;
        let lastAppliedDate: Date;

        if (type === "ONE_TIME") {
            if (!startDate || !endDate) {
                res.status(400).json({
                    success: false,
                    error: {
                        message:
                            "Start date and end date are required for one-time budgets",
                    },
                    data: null,
                });
                return;
            }
            budgetStartDate = new Date(startDate);
            budgetEndDate = new Date(endDate);
            lastAppliedDate = new Date(startDate);
        } else {
            const calculatedDates = calculateBudgetDates(type, new Date());
            if (!calculatedDates) {
                res.status(400).json({
                    success: false,
                    error: { message: "Invalid budget type" },
                    data: null,
                });
                return;
            }
            budgetStartDate = calculatedDates.startDate;
            budgetEndDate = calculatedDates.endDate;
            lastAppliedDate = calculatedDates.startDate;
        }

        const budget = await Budget.create({
            name,
            amount,
            type,
            mainCategoryId,
            subCategoryIds,
            spaceIds,
            spaceTypes,
            isMultiSpace: spaceIds.length > 1,
            startDate: budgetStartDate,
            endDate: type === "ONE_TIME" ? budgetEndDate : undefined,
            userId: userId,
            last_applied_date: lastAppliedDate
        });

        // Create ONE entry for all spaces combined
        await createBudgetEntry(budget, budgetStartDate, budgetEndDate);

        res.status(201).json({
            success: true,
            data: {
                object: budget,
                message: "Budget created successfully",
            },
            error: null,
        });
    } catch (error) {
        const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({
            success: false,
            error: { message: "Error creating budget: " + errorMessage },
            data: null,
        });
    }
});

// Update budget dates
budgetRouter.put("/:id/dates", authenticate, async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId: string = (req as any).user.id;
        const { startDate, endDate } = req.body;

        // Validate dates
        if (!startDate || !endDate) {
            res.status(400).json({
                success: false,
                error: { message: "Start date and end date are required" },
                data: null,
            });
            return;
        }

        const newStartDate = new Date(startDate);
        const newEndDate = new Date(endDate);

        if (isNaN(newStartDate.getTime()) || isNaN(newEndDate.getTime())) {
            res.status(400).json({
                success: false,
                error: { message: "Invalid date format" },
                data: null,
            });
            return;
        }

        if (newStartDate > newEndDate) {
            res.status(400).json({
                success: false,
                error: { message: "Start date must be before end date" },
                data: null,
            });
            return;
        }

        const existingBudget = await Budget.findOne({ _id: id });

        if (!existingBudget) {
            res.status(404).json({
                success: false,
                error: { message: "Budget not found" },
                data: null,
            });
            return;
        }

        // Check if user is the creator of the budget
        if (existingBudget.userId.toString() !== userId) {
            res.status(403).json({
                success: false,
                error: { message: "Only the budget creator can update budget dates" },
                data: null,
            });
            return;
        }

        // Only allow date updates for ONE_TIME budgets
        if (existingBudget.type !== "ONE_TIME") {
            res.status(400).json({
                success: false,
                error: { message: "Date updates are only allowed for one-time budgets" },
                data: null,
            });
            return;
        }

        // Update budget dates
        existingBudget.startDate = newStartDate;
        existingBudget.endDate = newEndDate;
        existingBudget.last_applied_date = newStartDate;
        await existingBudget.save();

        // Delete existing entries for this budget
        await BudgetEntry.deleteMany({ budget_id: id });

        // Create ONE new entry for all spaces with the updated dates
        const newStart = getStartOfDay(newStartDate);
        const newEnd = getEndOfDay(newEndDate);

        await createBudgetEntry(existingBudget, newStart, newEnd);

        res.status(200).json({
            success: true,
            data: {
                message: "Budget dates updated successfully!",
                budget: existingBudget
            },
            error: null,
        });
    } catch (error) {
        const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({
            success: false,
            error: { message: "Error updating budget dates: " + errorMessage },
            data: null,
        });
    }
});

// Update a budget amount
budgetRouter.put("/:id", authenticate, async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId: string = (req as any).user.id;
        const {
            amount,
            updateScope
        } = req.body;

        // Validate amount
        if (amount === undefined || amount <= 0) {
            res.status(400).json({
                success: false,
                error: { message: "Valid amount is required" },
                data: null,
            });
            return;
        }

        if (!updateScope || !['current', 'future', 'all'].includes(updateScope)) {
            res.status(400).json({
                success: false,
                error: { message: "Valid update scope is required (current, future, or all)" },
                data: null,
            });
            return;
        }

        const existingBudget = await Budget.findOne({ _id: id });

        if (!existingBudget) {
            res.status(404).json({
                success: false,
                error: { message: "Budget not found" },
                data: null,
            });
            return;
        }

        // Check if user is the creator of the budget
        if (existingBudget.userId.toString() !== userId) {
            res.status(403).json({
                success: false,
                error: { message: "Only the budget creator can update budget amount" },
                data: null,
            });
            return;
        }

        const today = new Date();

        // For ONE_TIME budgets, update the budget and its single entry
        if (existingBudget.type === "ONE_TIME") {
            //  Update the budget amount
            existingBudget.amount = amount;
            await existingBudget.save();

            // Find and update the single entry for this one-time budget
            const budgetEntry = await BudgetEntry.findOne({
                budget_id: id
            }).sort({ start_date: -1 }); // Get the most recent entry

            if (budgetEntry) {
                budgetEntry.amount = amount;
                await budgetEntry.save();
                console.log(`Updated one-time budget entry ${budgetEntry._id} amount to ${amount}`);
            } else {
                // If no entry exists, create one (shouldn't happen normally)
                const startDate = existingBudget.startDate || today;
                const endDate = existingBudget.endDate || today;
                await createBudgetEntry(existingBudget, startDate, endDate);
            }

            res.status(200).json({
                success: true,
                data: {
                    message: "One-time budget amount updated successfully!",
                    updateScope: 'current',
                    newAmount: amount
                },
                error: null,
            });
            return;
        }

        // For WEEKLY/MONTHLY budgets - original logic with scope
        switch (updateScope) {
            case 'current':
                // Update current entry (single entry for all spaces)
                const currentEntry = await getCurrentBudgetEntry(id, today);
                if (currentEntry) {
                    currentEntry.amount = amount;
                    await currentEntry.save();
                } else {
                    // If no current entry exists for a recurring budget, create one
                    if (existingBudget.type !== 'ONE_TIME') {
                        const calculatedDates = calculateBudgetDates(existingBudget.type, today);
                        if (calculatedDates) {
                            await createBudgetEntry(existingBudget, calculatedDates.startDate, calculatedDates.endDate);
                        }
                    }
                }
                break;

            case 'future':
                existingBudget.amount = amount;
                await existingBudget.save();

                // Update current and future entries
                const currentEntryFuture = await getCurrentBudgetEntry(id, today);
                if (currentEntryFuture) {
                    currentEntryFuture.amount = amount;
                    await currentEntryFuture.save();
                } else {
                    if (existingBudget.type !== 'ONE_TIME') {
                        const calculatedDates = calculateBudgetDates(existingBudget.type, today);
                        if (calculatedDates) {
                            await createBudgetEntry(existingBudget, calculatedDates.startDate, calculatedDates.endDate);
                        }
                    }
                }

                // Update future entries
                await BudgetEntry.updateMany(
                    {
                        budget_id: id,
                        start_date: { $gt: today }
                    },
                    { $set: { amount: amount } }
                );
                break;

            case 'all':
                existingBudget.amount = amount;
                await existingBudget.save();

                // Update all entries
                await BudgetEntry.updateMany(
                    { budget_id: id },
                    { $set: { amount: amount } }
                );
                break;

            default:
                res.status(400).json({
                    success: false,
                    error: { message: "Invalid update scope" },
                    data: null,
                });
                return;
        }

        res.status(200).json({
            success: true,
            data: {
                message: "Budget amount updated successfully!",
                updateScope: updateScope,
                newAmount: amount
            },
            error: null,
        });
    } catch (error) {
        const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({
            success: false,
            error: { message: "Error updating budget: " + errorMessage },
            data: null,
        });
    }
});

// Delete a budget and all its entries
budgetRouter.delete("/:id", authenticate, async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId: string = (req as any).user.id;

        const existingBudget = await Budget.findOne({ _id: id });

        if (!existingBudget) {
            res.status(404).json({
                success: false,
                error: { message: "Budget not found" },
                data: null,
            });
            return;
        }

        
        // Check if user is the creator of the budget
        if (existingBudget.userId.toString() !== userId) {
            res.status(403).json({
                success: false,
                error: { message: "Only the budget creator can delete this budget" },
                data: null,
            });
            return;
        }

        await BudgetEntry.deleteMany({ budget_id: id });
        await Budget.deleteOne({ _id: id });

        res.status(200).json({
            success: true,
            data: {
                message: "Budget deleted successfully",
            },
            error: null,
        });
    } catch (error) {
        const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({
            success: false,
            error: { message: "Error deleting budget: " + errorMessage },
            data: null,
        });
    }
});

// Get budgets with automatic entry creation - all users in space can view
budgetRouter.get("/", authenticate, async (req: Request, res: Response): Promise<void> => {
    try {
        const userId: string = (req as any).user.id;

        await checkAndCreateNewEntries(userId);

        // Get all budgets the user has access to via spaces
        // First, get all spaces the user has access to
        const accessibleSpaces = await Space.find({
            $or: [
                { ownerId: userId },
                { "collaborators.userId": userId, "collaborators.status": "ACCEPTED" }
            ]
        }).select('_id');

        const accessibleSpaceIds = accessibleSpaces.map(space => space._id);

        const budgets = await Budget.find({
            spaceIds: { $in: accessibleSpaceIds }
        }).sort({ createdAt: -1 });


        res.status(200).json({
            success: true,
            data: {
                object: budgets,
                message: "Budgets retrieved successfully!",
            },
            error: null,
        });
    } catch (error) {
        const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({
            success: false,
            error: { message: "Error finding budgets: " + errorMessage },
            data: null,
        });
    }
});

// Get budgets by space ID
budgetRouter.get("/space/:spaceId", authenticate, async (req: Request, res: Response): Promise<void> => {
    try {
        const userId: string = (req as any).user.id;
        const { spaceId } = req.params;

        // Check if user has access to this space
        const hasAccess = await canAccessSpace(userId, spaceId.toString());
        if (!hasAccess) {
            res.status(403).json({
                success: false,
                error: { message: "You don't have access to this space" },
                data: null,
            });
            return;
        }

        await checkAndCreateNewEntries(userId);

        // Find budgets that include this spaceId in their spaceIds array
        const spaceIdObj = new Types.ObjectId(spaceId.toString());
        const budgets = await Budget.find({
            spaceIds: spaceIdObj
        }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: {
                object: budgets,
                message: "Budgets retrieved successfully!",
            },
            error: null,
        });
    } catch (error) {
        const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({
            success: false,
            error: { message: "Error finding budgets: " + errorMessage },
            data: null,
        });
    }
});

// Get budgets by space and creator
budgetRouter.get("/space/:spaceId/creator/:creatorId", authenticate, async (req: Request, res: Response): Promise<void> => {
    try {
        const userId: string = (req as any).user.id;
        const { spaceId, creatorId } = req.params;

        // Check if user has access to this space
        const hasAccess = await canAccessSpace(userId, spaceId.toString());
        if (!hasAccess) {
            res.status(403).json({
                success: false,
                error: { message: "You don't have access to this space" },
                data: null,
            });
            return;
        }

        const spaceIdObj = new Types.ObjectId(spaceId.toString());
        const creatorIdObj = new Types.ObjectId(creatorId.toString());

        const budgets = await Budget.find({
            spaceIds: spaceIdObj,
            createdBy: creatorIdObj
        }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: {
                object: budgets,
                message: "Budgets retrieved successfully!",
            },
            error: null,
        });
    } catch (error) {
        const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({
            success: false,
            error: { message: "Error finding budgets: " + errorMessage },
            data: null,
        });
    }
});

// Get budgets by space type
budgetRouter.get("/space-type/:spaceType", authenticate, async (req: Request, res: Response): Promise<void> => {
    try {
        const userId: string = (req as any).user.id;
        const { spaceType } = req.params;

        // Get all spaces the user has access to of this type
        const accessibleSpaces = await Space.find({
            $or: [
                { ownerId: userId },
                { "collaborators.userId": userId, "collaborators.status": "ACCEPTED" }
            ],
            type: spaceType
        }).select('_id');

        const accessibleSpaceIds = accessibleSpaces.map(space => space._id);

        // Find budgets that have this spaceType in their spaceTypes array
        const budgets = await Budget.find({
            spaceTypes: spaceType,
            spaceIds: { $in: accessibleSpaceIds }
        }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: {
                object: budgets,
                message: "Budgets retrieved successfully!",
            },
            error: null,
        });
    } catch (error) {
        const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({
            success: false,
            error: { message: "Error finding budgets: " + errorMessage },
            data: null,
        });
    }
});

// Get budget spending with entries - now aggregates across all spaces
budgetRouter.get("/:id/spending", authenticate, async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId: string = (req as any).user.id;
        const { date } = req.query;

        // Validate date parameter
        let targetDate: Date;
        if (date) {
            targetDate = new Date(date as string);
            if (isNaN(targetDate.getTime())) {
                res.status(400).json({
                    success: false,
                    error: { message: "Invalid date format" },
                    data: null,
                });
                return;
            }
        } else {
            targetDate = new Date();
        }

        const budget = await Budget.findById(id);

        if (!budget) {
            res.status(404).json({
                success: false,
                error: { message: "Budget not found" },
                data: null,
            });
            return;
        }

        // Check if user has access to at least one space in the budget
        let hasAccess = false;
        for (const spaceId of budget.spaceIds) {
            const access = await canAccessSpace(userId, spaceId.toString());
            if (access) {
                hasAccess = true;
                break;
            }
        }

        if (!hasAccess) {
            res.status(403).json({
                success: false,
                error: { message: "You don't have access to this budget's spaces" },
                data: null,
            });
            return;
        }

        // Get the current budget entry for ALL spaces combined
        const currentEntry = await getCurrentBudgetEntry(id, targetDate);

        if (!currentEntry) {
            // Check if this is a ONE_TIME budget with future dates
            if (budget.type === 'ONE_TIME') {
                const today = new Date();
                const budgetStart = budget.startDate ? new Date(budget.startDate) : null;

                // If budget hasn't started yet, return empty data
                if (budgetStart && today < budgetStart) {
                    const emptySpendingData = {
                        budgetId: budget._id,
                        budgetName: budget.name,
                        budgetAmount: budget.amount,
                        totalSpent: 0,
                        remainingAmount: budget.amount,
                        percentage: 0,
                        overBudgetAmount: 0,
                        isOverBudget: false,
                        dailySpending: [],
                        categoryBreakdown: [],
                        startDate: budget.startDate,
                        endDate: budget.endDate,
                        budgetType: budget.type,
                        totalTransactions: 0,
                        trendData: [],
                        transactionDetails: [],
                        currentEntry: null,
                        spaceIds: budget.spaceIds
                    };

                    res.status(200).json({
                        success: true,
                        data: {
                            object: emptySpendingData,
                            message: "Budget hasn't started yet - no spending data",
                        },
                        error: null,
                    });
                    return;
                }
            }

            res.status(404).json({
                success: false,
                error: { message: "No budget entry found for this date period" },
                data: null,
            });
            return;
        }

        //  Get all entries without space filter
        const allEntries = await getBudgetEntries(id, budget.type === 'ONE_TIME' ? 0 : 12);

        // Prepare subcategory IDs
        let targetSubCategoryIds: Types.ObjectId[] = [];
        if (budget.subCategoryIds && budget.subCategoryIds.length > 0) {
            targetSubCategoryIds = budget.subCategoryIds.map(
                (id: any) => new Types.ObjectId(id.toString())
            );
        } else {
            const category = await Category.findById(budget.mainCategoryId);
            if (category && category.subCategories && category.subCategories.length > 0) {
                targetSubCategoryIds = category.subCategories.map(
                    (subCat: any) => new Types.ObjectId(subCat._id.toString())
                );
            }
        }

        // Get transaction details for current period
        const transactionDetails = await getTransactionDetailsForPeriod(
            id.toString(),
            currentEntry.start_date,
            currentEntry.end_date,
            budget.userId.toString(),
            budget.spaceIds.map((id: any) => new Types.ObjectId(id.toString())),
            targetSubCategoryIds,
            budget.spaceTypes
        );

        // Calculate total spent from transaction details
        const totalSpent = transactionDetails.reduce((sum, t) => sum + t.amount, 0);

        // Build daily spending from transaction details
        const dailySpendingMap = new Map();
        transactionDetails.forEach(t => {
            const dateStr = new Date(t.date instanceof Date ? t.date : t.date.toString()).toISOString().split('T')[0];
            dailySpendingMap.set(dateStr, (dailySpendingMap.get(dateStr) || 0) + t.amount);
        });

        const dailySpending = Array.from(dailySpendingMap.entries())
            .map(([date, amount]) => ({ date, amount }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        const budgetAmount = currentEntry.amount;
        const remainingAmount = Math.max(0, budgetAmount - totalSpent);
        const percentage = budgetAmount > 0 ? (totalSpent / budgetAmount) * 100 : 0;
        const isOverBudget = totalSpent > budgetAmount;
        const overBudgetAmount = Math.max(0, totalSpent - budgetAmount);

        // Query transactions from ALL spaces in the budget
        const query: any = {
            userId: new Types.ObjectId(budget.userId.toString()),
            date: {
                $gte: currentEntry.start_date,
                $lte: currentEntry.end_date,
            },
        };

        // Add space filter to include all spaces in the budget
        if (budget.spaceIds && budget.spaceIds.length > 0) {
            query.spaceId = {
                $in: budget.spaceIds.map((id: any) => new Types.ObjectId(id.toString()))
            };
        }

        // Determine transaction types based on space types
        const transactionTypes: TransactionType[] = [];

        budget.spaceTypes.forEach((spaceType: string) => {
            if (spaceType === "CASH" || spaceType === "BANK") {
                if (!transactionTypes.includes(TransactionType.EXPENSE)) {
                    transactionTypes.push(TransactionType.EXPENSE);
                }
            } else if (spaceType === "CREDIT_CARD") {
                if (!transactionTypes.includes(TransactionType.BALANCE_INCREASE)) {
                    transactionTypes.push(TransactionType.BALANCE_INCREASE);
                }
            }
        });

        if (transactionTypes.length > 0) {
            query.type = { $in: transactionTypes };
        }

        if (targetSubCategoryIds.length > 0) {
            query.scategory = { $in: targetSubCategoryIds };
        }

        const categoryBreakdown = await getCategoryBreakdown(query);

        // Enhance trend data with transaction details for each period
        const trendDataPromises = allEntries.map(async (entry) => {
            const entryTransactionDetails = await getTransactionDetailsForPeriod(
                id.toString(),
                entry.start_date,
                entry.end_date,
                userId.toString(),
                budget.spaceIds.map((id: any) => new Types.ObjectId(id.toString())),
                targetSubCategoryIds,
                budget.spaceTypes
            );

            return {
                period: entry.start_date,
                amount: entry.amount,
                spent: entry.spent || 0,
                start_date: entry.start_date,
                end_date: entry.end_date,
                transactionDetails: entryTransactionDetails
            };
        });

        const trendData = await Promise.all(trendDataPromises);

        // Update current entry spent amount if it doesn't match totalSpent
        if (currentEntry.spent !== totalSpent) {
            currentEntry.spent = totalSpent;
            await currentEntry.save();
        }

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
            startDate: currentEntry.start_date,
            endDate: currentEntry.end_date,
            budgetType: budget.type,
            totalTransactions: transactionDetails.length,
            transactionDetails,
            trendData,
            currentEntry: {
                id: currentEntry._id,
                amount: currentEntry.amount,
                spent: currentEntry.spent,
                start_date: currentEntry.start_date,
                end_date: currentEntry.end_date,
                spaceIds: currentEntry.spaceIds
            },
            spaceIds: budget.spaceIds
        };

        res.status(200).json({
            success: true,
            data: {
                object: spendingData,
                message: "Budget spending retrieved successfully!",
            },
            error: null,
        });
    } catch (error) {
        const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
        console.error("Error calculating budget spending:", error);
        res.status(500).json({
            success: false,
            error: {
                message: "Error calculating budget spending: " + errorMessage,
            },
            data: null,
        });
    }
});

// Update budget spent when transactions are created/updated/deleted
budgetRouter.post("/:id/update-spent", authenticate, async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId: string = (req as any).user.id;
        const {
            transactionDate,
            amount,
            isEdit = false,
            oldAmount = 0,
            spaceId
        } = req.body;

        console.log("update-spent called with:", {
            budgetId: id,
            userId,
            transactionDate,
            amount,
            isEdit,
            oldAmount,
            spaceId
        });

        // Validate required fields
        if (!transactionDate || amount === undefined || !spaceId) {
            res.status(400).json({
                success: false,
                error: { message: "Transaction date, amount, and space ID are required" },
                data: null,
            });
            return;
        }

        // Validate transaction date
        const targetDate = new Date(transactionDate);
        if (isNaN(targetDate.getTime())) {
            res.status(400).json({
                success: false,
                error: { message: "Invalid transaction date format" },
                data: null,
            });
            return;
        }

        // Convert amount and oldAmount to numbers
        const transactionAmount = convertAmountToNumber(amount);
        const oldTransactionAmount = convertAmountToNumber(oldAmount);

        console.log("Converted amounts:", {
            transactionAmount,
            oldTransactionAmount,
            isEdit
        });

        // Find the budget
        const budget = await Budget.findById(id);

        if (!budget) {
            res.status(404).json({
                success: false,
                error: { message: "Budget not found" },
                data: null,
            });
            return;
        }

        // Validate that transaction space ID is in budget's spaceIds
        const budgetSpaceIdsAsStrings = budget.spaceIds.map((id: any) => id.toString());
        if (!budgetSpaceIdsAsStrings.includes(spaceId)) {
            console.log("Space ID not found in budget:", {
                budgetSpaceIds: budgetSpaceIdsAsStrings,
                transactionSpaceId: spaceId
            });
            res.status(400).json({
                success: false,
                error: {
                    message: "Transaction space ID is not part of this budget"
                },
                data: null,
            });
            return;
        }

        // Find the budget entry for the transaction date (single entry for all spaces)
        const budgetEntry = await BudgetEntry.findOne({
            budget_id: id,
            start_date: { $lte: targetDate },
            end_date: { $gte: targetDate }
        });

        if (!budgetEntry) {
            const anyEntry = await BudgetEntry.findOne({ budget_id: id });
            if (!anyEntry) {
                console.log("No budget entries found for this budget");
                res.status(404).json({
                    success: false,
                    error: {
                        message: "No budget entries found for this budget"
                    },
                    data: null,
                });
            } else {
                console.log("Transaction date outside budget entry range", {
                    transactionDate: targetDate.toISOString(),
                    entryStart: anyEntry.start_date.toISOString(),
                    entryEnd: anyEntry.end_date.toISOString()
                });
                res.status(404).json({
                    success: false,
                    error: {
                        message: `No budget entry found for transaction date: ${targetDate.toISOString()}. ` +
                            `Budget entries exist from ${anyEntry.start_date.toISOString()} to ${anyEntry.end_date.toISOString()}`
                    },
                    data: null,
                });
            }
            return;
        }

        // Double-check transaction date is within budget entry date range
        if (targetDate < budgetEntry.start_date || targetDate > budgetEntry.end_date) {
            res.status(400).json({
                success: false,
                error: {
                    message: `Transaction date ${targetDate.toISOString()} is outside the budget entry period ` +
                        `(${budgetEntry.start_date.toISOString()} to ${budgetEntry.end_date.toISOString()})`
                },
                data: null,
            });
            return;
        }

        // Update spent amount - this entry aggregates all spaces
        const currentSpent = budgetEntry.spent || 0;
        let newSpent: number;

        if (isEdit) {
            const difference = transactionAmount - oldTransactionAmount;
            newSpent = currentSpent + difference;
            console.log(`Edit operation: oldAmount=${oldTransactionAmount}, newAmount=${transactionAmount}, difference=${difference}, oldSpent=${currentSpent}, newSpent=${newSpent}`);

            if (newSpent < 0) {
                console.warn(`Warning: Spent amount would go negative (${newSpent}). Setting to 0.`);
                newSpent = 0;
            }

        } else {
            // New transaction or delete: add amount (could be negative for deletions)
            newSpent = currentSpent + transactionAmount;
            console.log(`${transactionAmount >= 0 ? 'Create' : 'Delete'} operation: amount=${transactionAmount}, oldSpent=${currentSpent}, newSpent=${newSpent}`);

            if (newSpent < 0) {
                console.warn(`Warning: Spent amount would go negative (${newSpent}). Setting to 0.`);
                newSpent = 0;
            }
        }

        // Ensure spent doesn't go negative
        newSpent = Math.max(0, newSpent);
        budgetEntry.spent = newSpent;

        await budgetEntry.save();

        console.log(`Successfully updated budget entry ${budgetEntry._id} for budget ${id}. ` +
            `Transaction amount: ${transactionAmount}, Old spent: ${currentSpent}, New spent: ${newSpent}`);

        res.status(200).json({
            success: true,
            data: {
                message: "Budget spent amount updated successfully",
                newSpent: budgetEntry.spent,
                budgetEntryId: budgetEntry._id,
                period: {
                    start: budgetEntry.start_date,
                    end: budgetEntry.end_date
                },
                budgetId: budget._id,
                budgetName: budget.name,
                spaceId: spaceId,
                operation: isEdit ? 'edit' : (transactionAmount >= 0 ? 'create' : 'delete'),
                oldAmount: oldTransactionAmount,
                newAmount: transactionAmount
            },
            error: null,
        });
    } catch (error) {
        const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
        console.error("Error updating budget spent:", error);
        res.status(500).json({
            success: false,
            error: {
                message: "Error updating budget spent: " + errorMessage,
                details: error instanceof Error ? error.stack : 'No stack trace'
            },
            data: null,
        });
    }
});

export default budgetRouter;


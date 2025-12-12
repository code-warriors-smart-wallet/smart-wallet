import express, { Request, Response } from 'express';
import Transaction, { TransactionType } from '../models/transaction';
import Space, { SpaceType } from '../models/space';
import { authenticate } from '../middlewares/auth';
import mongoose from 'mongoose';
import Cat from '../models/category';

const dashboardRouter = express.Router();
const ObjectId = mongoose.Types.ObjectId;

dashboardRouter.get('/cash/:spaceid/:from/:to', authenticate, async (req: Request, res: Response) => {
    try {
        const userId: string = (req as any).user.id;
        const { spaceid, from, to } = req.params

        // current balance
        const totalIncome = await Transaction.aggregate([
            {
                $match: { userId: new ObjectId(userId) }
            },
            {
                $group: {
                    _id: "$to",
                    totalAmount: { $sum: "$amount" }
                }
            },
            {
                $match: {
                    _id: new ObjectId(spaceid),
                }
            },
        ]);

        const totalExpense = await Transaction.aggregate([
            {
                $match: { userId: new ObjectId(userId) }
            },
            {
                $group: {
                    _id: "$from",
                    totalAmount: { $sum: "$amount" }
                }
            },
            {
                $match: {
                    _id: new ObjectId(spaceid),           // category filter after grouping
                }
            },
        ]);

        // spending summary
        const moneyIn = await Transaction.aggregate([
            {
                $match: {
                    userId: new ObjectId(userId),
                    date: {
                        $gte: new Date(from),
                        $lte: new Date(to)
                    }
                }
            },
            {
                $group: {
                    _id: "$to",
                    totalAmount: { $sum: "$amount" }
                }
            },
            {
                $match: {
                    _id: new ObjectId(spaceid),           // category filter after grouping
                }
            },
        ]);

        const moneyOut = await Transaction.aggregate([
            {
                $match: {
                    userId: new ObjectId(userId),
                    date: {
                        $gte: new Date(from),
                        $lte: new Date(to)
                    }
                }
            },
            {
                $group: {
                    _id: "$from",
                    totalAmount: { $sum: "$amount" }
                }
            },
            {
                $match: {
                    _id: new ObjectId(spaceid),           // category filter after grouping
                }
            },
        ]);

        const spendingByPCategory = await Transaction.aggregate([
            // Filter transactions first
            {
                $match: {
                    userId: new ObjectId(userId),
                    date: { $gte: new Date(from), $lte: new Date(to) },
                    from: new ObjectId(spaceid),
                    pcategory: { $ne: null }
                },
            },
            // Group by category IDs
            {
                $group: {
                    _id: "$pcategory",
                    totalAmount: { $sum: "$amount" },
                },
            },
            // Lookup to get parent category names
            {
                $lookup: {
                    from: "cats", // name of your categories collection
                    localField: "_id", // the grouped pcategory ID
                    foreignField: "_id", // match with categories _id
                    as: "categoryData",
                },
            },
            { $unwind: { path: "$categoryData", preserveNullAndEmptyArrays: true } },
            // Project clean result
            {
                $project: {
                    _id: 0,
                    parentCategory: "$categoryData.parentCategory",
                    color: "$categoryData.color",
                    y: { $toDouble: "$totalAmount" }, // convert Decimal128 to number
                },
            },
            {
                $sort: { parentCategory: 1 }, // ascending by name
            },
        ])

        const spendingByCategory = await Transaction.aggregate([
            // Filter transactions first
            {
                $match: {
                    userId: new ObjectId(userId),
                    date: { $gte: new Date(from), $lte: new Date(to) },
                    from: new ObjectId(spaceid),
                    pcategory: { $ne: null }
                }
            },
            // Group by category IDs
            {
                $group: {
                    _id: { pcategory: "$pcategory", scategory: "$scategory" },
                    totalAmount: { $sum: "$amount" }
                }
            },
            // Lookup parent category
            {
                $lookup: {
                    from: "cats",              // collection name
                    localField: "_id.pcategory",     // ID in transactions
                    foreignField: "_id",             // ID in categories collection
                    as: "parentCategory"
                }
            },
            {
                $unwind: { path: "$parentCategory", preserveNullAndEmptyArrays: true }
            },
            // Lookup subcategory inside the parent
            {
                $addFields: {
                    subCategoryName: {
                        $arrayElemAt: [
                            {
                                $filter: {
                                    input: "$parentCategory.subCategories",
                                    cond: { $eq: ["$$this._id", "$_id.scategory"] }
                                }
                            },
                            0
                        ]
                    }
                }
            },
            // Project clean result
            {
                $project: {
                    _id: 0,
                    parentCategory: "$parentCategory.parentCategory",
                    color: "$subCategoryName.color",
                    subCategory: "$subCategoryName.name",
                    y: { $toDouble: "$totalAmount" }
                }
            },
            {
                $sort: { parentCategory: 1 } // ascending by name
            }
        ])

        const incomeByCategory = await Transaction.aggregate([
            // 1️⃣ Filter transactions
            {
                $match: {
                    userId: new ObjectId(userId),
                    date: { $gte: new Date(from), $lte: new Date(to) },
                    to: new ObjectId(spaceid),
                }
            },
            // 2️⃣ Group by subcategory ID
            {
                $group: {
                    _id: "$scategory",
                    totalAmount: { $sum: "$amount" }
                }
            },
            // 3️⃣ Lookup parent categories to get subcategory names
            {
                $lookup: {
                    from: "cats",          // categories collection
                    localField: "_id",           // scategory ID
                    foreignField: "subCategories._id", // match inside subCategories array
                    as: "categoryData"
                }
            },
            { $unwind: { path: "$categoryData", preserveNullAndEmptyArrays: true } },
            // 4️⃣ Extract subcategory name
            {
                $addFields: {
                    subCategoryName: {
                        $arrayElemAt: [
                            {
                                $filter: {
                                    input: "$categoryData.subCategories",
                                    cond: { $eq: ["$$this._id", "$_id"] }
                                }
                            },
                            0
                        ]
                    }
                }
            },
            // 5️⃣ Project final fields
            {
                $project: {
                    _id: 0,
                    subCategory: "$subCategoryName.name",
                    color: "$subCategoryName.color",
                    y: { $toDouble: "$totalAmount" } // convert Decimal128 to number for charts
                }
            },
            // 6️⃣ Optional: sort by subcategory name
            { $sort: { subCategory: 1 } }
        ])

        const today = new Date();
        const last12Months = Array.from({ length: 12 }).map((_, i) => {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const monthName = d.toLocaleString("default", { month: "short" }); // "Jan", "Feb"
            return {
                year: d.getFullYear(),
                month: d.getMonth() + 1,
                x: `${d.getFullYear()} ${monthName}`
            };
        }).reverse();

        const rawMonthlyExpense = await Transaction.aggregate([
            {
                $match: {
                    userId: new ObjectId(userId),
                    from: new ObjectId(spaceid),
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$date" },
                        month: { $month: "$date" }
                    },
                    totalAmount: { $sum: "$amount" }
                }
            },
            {
                $sort: {
                    "_id.year": 1,
                    "_id.month": 1
                }
            },
            {
                $project: {
                    _id: 0,
                    year: "$_id.year",
                    month: "$_id.month",
                    x: {
                        $let: {
                            vars: {
                                date: {
                                    $dateFromParts: {
                                        year: "$_id.year",
                                        month: "$_id.month",
                                        day: 1
                                    }
                                }
                            },
                            in: {
                                $dateToString: {
                                    format: "%Y %b", // ✅ Example: "2025 Feb"
                                    date: "$$date"
                                }
                            }
                        }
                    },
                    y: { $toDouble: "$totalAmount" }
                }
            }

        ])

        const rawMonthlyIncome = await Transaction.aggregate([
            {
                $match: {
                    userId: new ObjectId(userId),
                    to: new ObjectId(spaceid),
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$date" },
                        month: { $month: "$date" }
                    },
                    totalAmount: { $sum: "$amount" }
                }
            },
            {
                $sort: {
                    "_id.year": 1,
                    "_id.month": 1
                }
            },
            {
                $project: {
                    _id: 0,
                    year: "$_id.year",
                    month: "$_id.month",
                    x: {
                        $let: {
                            vars: {
                                date: {
                                    $dateFromParts: {
                                        year: "$_id.year",
                                        month: "$_id.month",
                                        day: 1
                                    }
                                }
                            },
                            in: {
                                $dateToString: {
                                    format: "%Y %b", // ✅ Example: "2025 Feb"
                                    date: "$$date"
                                }
                            }
                        }
                    },
                    y: { $toDouble: "$totalAmount" }
                }
            }

        ])

        const monthlyIncome = last12Months.map(({ year, month, x }) => {
            const record = rawMonthlyIncome.find(r => r.year === year && r.month === month);
            return {
                x,
                y: record ? parseFloat(record.y.toString()) : 0
            };
        });

        const monthlyExpense = last12Months.map(({ year, month, x }) => {
            const record = rawMonthlyExpense.find(r => r.year === year && r.month === month);
            return {
                x,
                y: record ? parseFloat(record.y.toString()) : 0
            };
        });

        res.status(200).json({
            success: true,
            data: {
                object: {
                    totalIncome: totalIncome,
                    totalExpense: totalExpense,
                    spendingSummary: {
                        moneyIn: moneyIn,
                        moneyOut: moneyOut,
                        spendingByPCategory: spendingByPCategory,
                        spendingByCategory: spendingByCategory,
                        top5expense: [],
                        incomeByCategory: incomeByCategory,
                        top5income: [],
                        monthlyExpense: monthlyExpense,
                        monthlyIncome: monthlyIncome
                    }
                },
                message: 'Data retreived successfully!'
            },
            error: null
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            success: false,
            error: { message: 'Error finding dashboard info: ' + errorMessage },
            data: null
        });
    }
})

dashboardRouter.get('/loan-lent/:spaceid', authenticate, async (req: Request, res: Response) => {
    try {
        const userId: string = (req as any).user.id;
        const { spaceid } = req.params

        const categories = await Cat.aggregate([
            { $match: { spaces: SpaceType.LOAN_LENT } },

            { $unwind: "$subCategories" },

            {
                $project: {
                    parentCategoryId: "$_id",
                    parentCategory: 1,
                    spaces: 1,
                    subCategoryId: "$subCategories._id",
                    subCategoryName: "$subCategories.name",
                    transactionTypes: "$subCategories.transactionTypes"
                }
            }
        ])

        const principalReceivedCategoryId = categories.find(cat => cat.subCategoryName === "Principal Repayment").subCategoryId;
        const interestReceivedCategoryId = categories.find(cat => cat.subCategoryName === "Interest").subCategoryId;

        const principalReceived = await Transaction.aggregate([
            {
                $match: {
                    from: new ObjectId(spaceid),
                    type: TransactionType.REPAYMENT_RECEIVED,
                    scategory: principalReceivedCategoryId
                }
            },
            {
                $group: {
                    _id: null, // null means group all documents that matched
                    total: { $sum: "$amount" }
                }
            },
            {
                $project: {
                    _id: 0,
                    amount: { $toDouble: "$total" }
                }
            }

        ])

        const interestReceived = await Transaction.aggregate([
            {
                $match: {
                    from: new ObjectId(spaceid),
                    type: TransactionType.REPAYMENT_RECEIVED,
                    scategory: interestReceivedCategoryId
                }
            },
            {
                $group: {
                    _id: null, // null means group all documents that matched
                    total: { $sum: "$amount" }
                }
            },
            {
                $project: {
                    _id: 0,
                    amount: { $toDouble: "$total" }
                }
            }
        ])

        const loan = await Space.find({
            _id: spaceid,
        })

        const loanPrincipalTransaction = await Transaction.findOne({
            to: spaceid,
            type: TransactionType.LOAN_PRINCIPAL
        })

        const recentTransactions = await Transaction.find({
            $and: [
                { userId: userId },
                {
                    $or: [
                        { from: spaceid },
                        { to: spaceid }
                    ]
                }
            ]
        }).sort({ date: -1 }).limit(5).lean()

        res.status(200).json({
            success: true,
            data: {
                object: {
                    loan: loan,
                    loanPrincipalTransaction: loanPrincipalTransaction,
                    principalReceived: principalReceived,
                    interestReceived: interestReceived,
                    recentTransactions: recentTransactions
                },
                message: 'Data retreived successfully!'
            },
            error: null
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            success: false,
            error: { message: 'Error finding dashboard info: ' + errorMessage },
            data: null
        });
    }
})

dashboardRouter.get('/loan-borrowed/:spaceid', authenticate, async (req: Request, res: Response) => {
    try {
        const userId: string = (req as any).user.id;
        const { spaceid } = req.params;

        const categories = await Cat.aggregate([
            { $match: { spaces: SpaceType.LOAN_BORROWED } },

            { $unwind: "$subCategories" },

            {
                $project: {
                    parentCategoryId: "$_id",
                    parentCategory: 1,
                    spaces: 1,
                    subCategoryId: "$subCategories._id",
                    subCategoryName: "$subCategories.name",
                    transactionTypes: "$subCategories.transactionTypes"
                }
            }
        ])

        const principalPaidCategoryId = categories.find(cat => cat.subCategoryName === "Principal Repayment").subCategoryId;
        const interestPaidCategoryId = categories.find(cat => cat.subCategoryName === "Interest").subCategoryId;

        const principalPaid = await Transaction.aggregate([
            {
                $match: {
                    to: new ObjectId(spaceid),
                    type: TransactionType.REPAYMENT_PAID,
                    scategory: principalPaidCategoryId
                }
            },
            {
                $group: {
                    _id: null, // null means group all documents that matched
                    total: { $sum: "$amount" }
                }
            },
            {
                $project: {
                    _id: 0,
                    amount: { $toDouble: "$total" }
                }
            }

        ])

        const interestPaid = await Transaction.aggregate([
            {
                $match: {
                    to: new ObjectId(spaceid),
                    type: TransactionType.REPAYMENT_PAID,
                    scategory: interestPaidCategoryId
                }
            },
            {
                $group: {
                    _id: null, // null means group all documents that matched
                    total: { $sum: "$amount" }
                }
            },
            {
                $project: {
                    _id: 0,
                    amount: { $toDouble: "$total" }
                }
            }
        ])

        const loan = await Space.find({
            _id: spaceid,
        })

        const loanPrincipalTransaction = await Transaction.findOne({
            from: spaceid,
            type: TransactionType.LOAN_PRINCIPAL
        })

        const recentTransactions = await Transaction.find({
            $and: [
                { userId: userId },
                {
                    $or: [
                        { from: spaceid },
                        { to: spaceid }
                    ]
                }
            ]
        }).sort({ date: -1 }).limit(5).lean()

        res.status(200).json({
            success: true,
            data: {
                object: {
                    loan: loan,
                    loanPrincipalTransaction: loanPrincipalTransaction,
                    principalPaid: principalPaid,
                    interestPaid: interestPaid,
                    recentTransactions: recentTransactions
                },
                message: 'Data retreived successfully!'
            },
            error: null
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            success: false,
            error: { message: 'Error finding dashboard info: ' + errorMessage },
            data: null
        });
    }
})

dashboardRouter.get('/credit-card/:spaceid', authenticate, async (req: Request, res: Response) => {
    try {
        const userId: string = (req as any).user.id;
        const { spaceid } = req.params

        const totalBalance = await Transaction.aggregate([
            {
                $match: {
                    $and: [
                        { userId: { $eq: new ObjectId(userId) } },
                        {
                            $or: [
                                { to: new ObjectId(spaceid) },
                                { from: new ObjectId(spaceid) },
                            ],
                        },
                        { type: { $eq: TransactionType.BALANCE_INCREASE } }
                    ]
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$amount" }
                }
            },
            {
                $project: {
                    _id: 0,
                    amount: { $toDouble: "$total" }
                }
            }

        ])

        const totalPayment = await Transaction.aggregate([
            {
                $match: {
                    $and: [
                        { userId: { $eq: new ObjectId(userId) } },
                        {
                            $or: [
                                { to: new ObjectId(spaceid) },
                                { from: new ObjectId(spaceid) },
                            ],
                        },
                        { type: { $eq: TransactionType.BALANCE_DECREASE } }
                    ]
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$amount" }
                }
            },
            {
                $project: {
                    _id: 0,
                    amount: { $toDouble: "$total" }
                }
            }

        ])

        const recentTransactions = await Transaction.find({
            $and: [
                { userId: userId },
                {
                    $or: [
                        { from: spaceid },
                        { to: spaceid }
                    ]
                }
            ]
        }).sort({ date: -1 }).limit(5).lean()

        const spaceInfo = await Space.find({
            _id: spaceid,
        })

        res.status(200).json({
            success: true,
            data: {
                object: {
                    spaceInfo: spaceInfo,
                    totalBalance: totalBalance,
                    totalPayment: totalPayment,
                    recentTransactions: recentTransactions
                },
                message: 'Data retreived successfully!'
            },
            error: null
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            success: false,
            error: { message: 'Error finding dashboard info: ' + errorMessage },
            data: null
        });
    }
})

dashboardRouter.get('/saving-goal/:spaceid', authenticate, async (req: Request, res: Response) => {
    try {
        const userId: string = (req as any).user.id;
        const { spaceid } = req.params;

        const categories = await Cat.aggregate([
            { $match: { spaces: SpaceType.SAVING_GOAL } },

            { $unwind: "$subCategories" },

            {
                $project: {
                    parentCategoryId: "$_id",
                    parentCategory: 1,
                    spaces: 1,
                    subCategoryId: "$subCategories._id",
                    subCategoryName: "$subCategories.name",
                    transactionTypes: "$subCategories.transactionTypes"
                }
            }
        ])

        const savingCategoryId = categories.find(cat => cat.subCategoryName === "Saving").subCategoryId;
        const withdrawCategoryId = categories.find(cat => cat.subCategoryName === "Withdraw").subCategoryId;

        const savedAmount = await Transaction.aggregate([
            {
                $match: {
                    to: new ObjectId(spaceid),
                    type: TransactionType.SAVING,
                    scategory: savingCategoryId
                }
            },
            {
                $group: {
                    _id: null, // null means group all documents that matched
                    total: { $sum: "$amount" }
                }
            },
            {
                $project: {
                    _id: 0,
                    amount: { $toDouble: "$total" }
                }
            }

        ])

        const withdrawAmount = await Transaction.aggregate([
            {
                $match: {
                    from: new ObjectId(spaceid),
                    type: TransactionType.WITHDRAW,
                    scategory: withdrawCategoryId
                }
            },
            {
                $group: {
                    _id: null, // null means group all documents that matched
                    total: { $sum: "$amount" }
                }
            },
            {
                $project: {
                    _id: 0,
                    amount: { $toDouble: "$total" }
                }
            }
        ])

        const goal = await Space.find({
            _id: spaceid,
        })

        // const loanPrincipalTransaction = await Transaction.findOne({
        //     from: spaceid,
        //     type: TransactionType.LOAN_PRINCIPAL
        // })

        const recentTransactions = await Transaction.find({
            $and: [
                { userId: userId },
                {
                    $or: [
                        { from: spaceid },
                        { to: spaceid }
                    ]
                }
            ]
        }).sort({ date: -1 }).limit(5).lean()

        res.status(200).json({
            success: true,
            data: {
                object: {
                    goal: goal.length > 0 ? goal[0] : {},
                    savedAmount: savedAmount.length > 0 ? savedAmount[0].amount : 0,
                    withdrawAmount: withdrawAmount.length > 0 ? withdrawAmount[0].amount : 0,
                    recentTransactions: recentTransactions
                },
                message: 'Data retreived successfully!'
            },
            error: null
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            success: false,
            error: { message: 'Error finding dashboard info: ' + errorMessage },
            data: null
        });
    }
})

dashboardRouter.get("/all", authenticate, async (req: Request, res: Response) => {
    const userId: string = (req as any).user.id;
    // const { userId } = req.params

    // cash totoal income
    try {
        let totalCashAssetAmount = 0;
        let totalBankAssetAmount = 0;
        let totalLoanLentAssetAmount = 0;
        let totalLoanBorrowedLiabilityAmount = 0;
        let totalCreditcardLiabilityAmount = 0

        // cash
        const cashTotalIncome = await Transaction.aggregate([
            {
                $lookup: {
                    from: "spaces",
                    as: "toSpace",
                    localField: "to",
                    foreignField: "_id"
                },

            },

            {
                $unwind: "$toSpace"
            },

            {
                $match: {
                    "userId": new ObjectId(userId),
                    "toSpace.type": SpaceType.CASH,
                }
            },

            {
                $group: {
                    _id: { spaceId: "$toSpace._id", spaceName: "$toSpace.name", spaceType: "$toSpace.type", color: "$toSpace.color" },
                    total: { $sum: "$amount" }
                }
            },

            {
                $project: {
                    _id: 0,
                    id: "$_id.spaceId",
                    spaceName: "$_id.spaceName",
                    spaceType: "$_id.spaceType",
                    color: "$_id.color",
                    amount: { $toDouble: "$total" }
                }
            }
        ])

        const cashTotalExpense = await Transaction.aggregate([
            {
                $lookup: {
                    from: "spaces",
                    as: "fromSpace",
                    localField: "from",
                    foreignField: "_id"
                },

            },

            {
                $unwind: "$fromSpace"
            },

            {
                $match: {
                    "userId": new ObjectId(userId),
                    "fromSpace.type": SpaceType.CASH,
                }
            },

            {
                $group: {
                    _id: { spaceId: "$fromSpace._id", spaceName: "$fromSpace.name", spaceType: "$fromSpace.type", color: "$fromSpace.color" },
                    total: { $sum: "$amount" }
                }
            },

            {
                $project: {
                    _id: 0,
                    id: "$_id.spaceId",
                    spaceName: "$_id.spaceName",
                    spaceType: "$_id.spaceType",
                    color: "$_id.color",
                    amount: { $toDouble: "$total" }
                }
            }
        ])

        const cashAssetsInfo = cashTotalIncome.map((rec) => {
            const totalExpense = cashTotalExpense.find(rec2 => String(rec2.id) === String(rec.id));
            const expenseAmount = totalExpense?.amount || 0;
            totalCashAssetAmount += rec.amount - expenseAmount
            return {
                id: rec.id,
                x: rec.spaceName,
                spaceType: rec.spaceType,
                totalIncome: rec.amount,
                totalExpense: expenseAmount,
                color: rec.color,
                y: rec.amount - expenseAmount
            }
        })

        // bank
        const bankTotalIncome = await Transaction.aggregate([
            {
                $lookup: {
                    from: "spaces",
                    as: "toSpace",
                    localField: "to",
                    foreignField: "_id"
                },

            },

            {
                $unwind: "$toSpace"
            },

            {
                $match: {
                    "userId": new ObjectId(userId),
                    "toSpace.type": SpaceType.BANK,
                }
            },

            {
                $group: {
                    _id: { spaceId: "$toSpace._id", spaceName: "$toSpace.name", spaceType: "$toSpace.type", color: "$toSpace.color" },
                    total: { $sum: "$amount" }
                }
            },

            {
                $project: {
                    _id: 0,
                    id: "$_id.spaceId",
                    spaceName: "$_id.spaceName",
                    spaceType: "$_id.spaceType",
                    color: "$_id.color",
                    amount: { $toDouble: "$total" }
                }
            }
        ])

        const bankTotalExpense = await Transaction.aggregate([
            {
                $lookup: {
                    from: "spaces",
                    as: "fromSpace",
                    localField: "from",
                    foreignField: "_id"
                },

            },

            {
                $unwind: "$fromSpace"
            },

            {
                $match: {
                    "userId": new ObjectId(userId),
                    "fromSpace.type": SpaceType.BANK,
                }
            },

            {
                $group: {
                    _id: { spaceId: "$fromSpace._id", spaceName: "$fromSpace.name", spaceType: "$fromSpace.type", color: "$fromSpace.color" },
                    total: { $sum: "$amount" }
                }
            },

            {
                $project: {
                    _id: 0,
                    id: "$_id.spaceId",
                    spaceName: "$_id.spaceName",
                    spaceType: "$_id.spaceType",
                    amount: { $toDouble: "$total" }
                }
            }
        ])

        const bankAssetsInfo = bankTotalIncome.map((rec) => {
            const totalExpense = bankTotalExpense.find(rec2 => String(rec2.id) === String(rec.id));
            const expenseAmount = totalExpense?.amount || 0;
            totalBankAssetAmount += rec.amount - expenseAmount
            return {
                id: rec.id,
                x: rec.spaceName,
                spaceType: rec.spaceType,
                totalIncome: rec.amount,
                totalExpense: expenseAmount,
                color: rec.color,
                y: rec.amount - expenseAmount
            }
        })

        // loan lent
        const totalLoanLentPrincipal = await Transaction.aggregate([
            {
                $match: {
                    "userId": new ObjectId(userId),
                    "type": TransactionType.LOAN_PRINCIPAL
                },
            },

            {
                $lookup: {
                    from: "spaces",
                    as: "space",
                    localField: "spaceId",
                    foreignField: "_id"
                },

            },

            {
                $unwind: "$space"
            },

            {
                $match: {
                    "space.type": SpaceType.LOAN_LENT,
                }
            },

            {
                $group: {
                    _id: { spaceId: "$space._id", spaceName: "$space.name", spaceType: "$space.type", color: "$space.color" },
                    total: { $sum: "$amount" }
                }
            },

            {
                $project: {
                    _id: 0,
                    id: "$_id.spaceId",
                    spaceName: "$_id.spaceName",
                    spaceType: "$_id.spaceType",
                    color: "$_id.color",
                    amount: { $toDouble: "$total" }
                }
            }
        ])

        const loanlentcategories = await Cat.aggregate([
            { $match: { spaces: SpaceType.LOAN_LENT } },

            { $unwind: "$subCategories" },

            {
                $project: {
                    parentCategoryId: "$_id",
                    parentCategory: 1,
                    spaces: 1,
                    subCategoryId: "$subCategories._id",
                    subCategoryName: "$subCategories.name",
                    transactionTypes: "$subCategories.transactionTypes"
                }
            }
        ])

        const principalReceivedCategoryId = loanlentcategories.find(cat => cat.subCategoryName === "Principal Repayment").subCategoryId;

        const totalLoanLentRepayment = await Transaction.aggregate([
            {
                $match: {
                    "userId": new ObjectId(userId),
                    "type": TransactionType.REPAYMENT_RECEIVED,
                    "scategory": new ObjectId(principalReceivedCategoryId)
                },
            },

            {
                $group: {
                    _id: { spaceId: "$spaceId" },
                    total: { $sum: "$amount" }
                }
            },

            {
                $project: {
                    _id: 0,
                    id: "$_id.spaceId",
                    amount: { $toDouble: "$total" }
                }
            }
        ])

        const loanlentAssetsInfo = totalLoanLentPrincipal.map((rec) => {
            const totalExpense = totalLoanLentRepayment.find(rec2 => String(rec2.id) === String(rec.id));
            const expenseAmount = totalExpense?.amount || 0;
            totalLoanLentAssetAmount += rec.amount - expenseAmount
            return {
                id: rec.id,
                x: rec.spaceName,
                spaceType: rec.spaceType,
                totalIncome: rec.amount,
                color: rec.color,
                totalExpense: expenseAmount,
                y: rec.amount - expenseAmount
            }
        })

        // loan borrowed
        const totalLoanBorrowedPrincipal = await Transaction.aggregate([
            {
                $match: {
                    "userId": new ObjectId(userId),
                    "type": TransactionType.LOAN_PRINCIPAL
                },
            },

            {
                $lookup: {
                    from: "spaces",
                    as: "space",
                    localField: "spaceId",
                    foreignField: "_id"
                },

            },

            {
                $unwind: "$space"
            },

            {
                $match: {
                    "space.type": SpaceType.LOAN_BORROWED,
                }
            },

            {
                $group: {
                    _id: { spaceId: "$space._id", spaceName: "$space.name", spaceType: "$space.type", color: "$space.color" },
                    total: { $sum: "$amount" }
                }
            },

            {
                $project: {
                    _id: 0,
                    id: "$_id.spaceId",
                    spaceName: "$_id.spaceName",
                    spaceType: "$_id.spaceType",
                    color: "$_id.color",
                    amount: { $toDouble: "$total" }
                }
            }
        ])

        const loanborrowedcategories = await Cat.aggregate([
            { $match: { spaces: SpaceType.LOAN_BORROWED } },

            { $unwind: "$subCategories" },

            {
                $project: {
                    parentCategoryId: "$_id",
                    parentCategory: 1,
                    spaces: 1,
                    subCategoryId: "$subCategories._id",
                    subCategoryName: "$subCategories.name",
                    transactionTypes: "$subCategories.transactionTypes"
                }
            }
        ])

        const principalPaidCategoryId = loanborrowedcategories.find(cat => cat.subCategoryName === "Principal Repayment").subCategoryId;

        const totalLoanBorrowedRepayment = await Transaction.aggregate([
            {
                $match: {
                    "userId": new ObjectId(userId),
                    "type": TransactionType.REPAYMENT_PAID,
                    "scategory": new ObjectId(principalPaidCategoryId)
                },
            },

            {
                $group: {
                    _id: { spaceId: "$spaceId" },
                    total: { $sum: "$amount" }
                }
            },

            {
                $project: {
                    _id: 0,
                    id: "$_id.spaceId",
                    amount: { $toDouble: "$total" }
                }
            }
        ])

        const loanborrowedLiabiltitiesInfo = totalLoanBorrowedPrincipal.map((rec) => {
            const totalExpense = totalLoanBorrowedRepayment.find(rec2 => String(rec2.id) === String(rec.id));
            const expenseAmount = totalExpense?.amount || 0;
            totalLoanBorrowedLiabilityAmount += rec.amount - expenseAmount
            return {
                id: rec.id,
                x: rec.spaceName,
                spaceType: rec.spaceType,
                totalIncome: rec.amount,
                color: rec.color,
                totalExpense: expenseAmount,
                y: rec.amount - expenseAmount
            }
        })

        // credit card
        const creditcardTotalBalance = await Transaction.aggregate([
            {
                $match: {
                    $and: [
                        { userId: { $eq: new ObjectId(userId) } },
                        { type: { $eq: TransactionType.BALANCE_INCREASE } }
                    ]
                }
            },
            {
                $lookup: {
                    from: "spaces",
                    as: "space",
                    localField: "spaceId",
                    foreignField: "_id"
                },

            },

            {
                $unwind: "$space"
            },
            {
                $group: {
                    _id: { spaceId: "$space._id", spaceName: "$space.name", spaceType: "$space.type", color: "$space.color" },
                    total: { $sum: "$amount" }
                }
            },

            {
                $project: {
                    _id: 0,
                    id: "$_id.spaceId",
                    spaceName: "$_id.spaceName",
                    spaceType: "$_id.spaceType",
                    color: "$_id.color",
                    amount: { $toDouble: "$total" }
                }
            }
        ])
        const creditcardTotalPayment = await Transaction.aggregate([
            {
                $match: {
                    $and: [
                        { userId: { $eq: new ObjectId(userId) } },
                        { type: { $eq: TransactionType.BALANCE_DECREASE } }
                    ]
                }
            },
            {
                $lookup: {
                    from: "spaces",
                    as: "space",
                    localField: "spaceId",
                    foreignField: "_id"
                },

            },

            {
                $unwind: "$space"
            },
            {
                $group: {
                    _id: { spaceId: "$space._id", spaceName: "$space.name", spaceType: "$space.type" },
                    total: { $sum: "$amount" }
                }
            },

            {
                $project: {
                    _id: 0,
                    id: "$_id.spaceId",
                    spaceName: "$_id.spaceName",
                    spaceType: "$_id.spaceType",
                    amount: { $toDouble: "$total" }
                }
            }
        ])

        const creditcardLiabiltitiesInfo = creditcardTotalBalance.map((rec) => {
            const totalExpense = creditcardTotalPayment.find(rec2 => String(rec2.id) === String(rec.id));
            const expenseAmount = totalExpense?.amount || 0;
            totalCreditcardLiabilityAmount += rec.amount - expenseAmount
            return {
                id: rec.id,
                x: rec.spaceName,
                spaceType: rec.spaceType,
                totalIncome: rec.amount,
                color: rec.color,
                totalExpense: expenseAmount,
                y: rec.amount - expenseAmount
            }
        })

        res.status(200).json({
            success: true,
            data: {
                object: {
                    assetsInfo: [...cashAssetsInfo, ...bankAssetsInfo, ...loanlentAssetsInfo],
                    liabilitiesInfo: [...loanborrowedLiabiltitiesInfo, ...creditcardLiabiltitiesInfo],
                    totalCashAssetAmount, totalBankAssetAmount, totalLoanLentAssetAmount, totalLoanBorrowedLiabilityAmount, totalCreditcardLiabilityAmount
                },
                message: 'Data retreived successfully!'
            },
            error: null
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            success: false,
            error: { message: 'Error finding dashboard info: ' + errorMessage },
            data: null
        });
    }
})

export default dashboardRouter;

import express, { Request, Response } from 'express';
import Space, { SpaceType } from '../models/space';
import Transaction from '../models/transaction';
import Cat from '../models/category';
import { authenticate } from '../middlewares/auth';
import { TransactionType } from '../models/transaction';

const spaceRouter = express.Router();

spaceRouter.post('/', authenticate, async (req: Request, res: Response) => {
    try {
        const userId: string = (req as any).user.id;
        let spaceModal: any = null

        if (req.body.type == SpaceType.CREDIT_CARD) {
            spaceModal = {
                type: req.body.type,
                name: req.body.name,
                ownerId: userId,
                isDefault: false,
                creditCardLimit: req.body.creditCardLimit,
                creditCardStatementDate: req.body.statementDate,
                creditCardDueDate: req.body.dueDate,
            }
        } else if (req.body.type == SpaceType.LOAN_BORROWED || req.body.type == SpaceType.LOAN_LENT) {
            spaceModal = {
                type: req.body.type,
                name: req.body.name,
                ownerId: userId,
                isDefault: false,
                loanPrincipal: req.body.loanPrincipal,
                loanStartDate: req.body.loanStartDate,
                loanEndDate: req.body.loanEndDate
            }
        } else if (req.body.type == SpaceType.SAVING_GOAL) {
            spaceModal = {
                type: req.body.type,
                name: req.body.name,
                ownerId: userId,
                isDefault: false,
                targetAmount: req.body.targetAmount,
                desiredDate: req.body.desiredDate,
            }
        } else {
            spaceModal = {
                type: req.body.type,
                name: req.body.name,
                ownerId: userId,
                isDefault: false,
            }
        }

        const space = await Space.create(spaceModal)
        const today = new Date()

        if (req.body.type == SpaceType.LOAN_BORROWED) {
            const scategories = await Cat.aggregate([
                { $match: { spaces: SpaceType.LOAN_BORROWED } },

                { $unwind: "$subCategories" },

                {
                    $project: {
                        parentCategoryId: "$_id",
                        parentCategory: 1,
                        subCategoryId: "$subCategories._id",
                        subCategoryName: "$subCategories.name",
                        transactionTypes: "$subCategories.transactionTypes"
                    }
                }
            ]);

            const scategory = scategories.find(cat => cat.transactionTypes.includes(TransactionType.LOAN_PRINCIPAL))

            let transaction = {
                type: TransactionType.LOAN_PRINCIPAL,
                amount: req.body.loanPrincipal,
                to: req.body.to,
                from: space._id,
                date: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`,
                note: "",
                pcategory: scategory?.parentCategoryId,
                scategory: scategory?.subCategoryId,
                userId: userId,
                spaceId: space._id,
            }
            await Transaction.create(transaction)
        } else if (req.body.type == SpaceType.LOAN_LENT) {
            const scategories = await Cat.aggregate([
                { $match: { spaces: SpaceType.LOAN_LENT } },

                { $unwind: "$subCategories" },

                {
                    $project: {
                        parentCategoryId: "$_id",
                        parentCategory: 1,
                        subCategoryId: "$subCategories._id",
                        subCategoryName: "$subCategories.name",
                        transactionTypes: "$subCategories.transactionTypes"
                    }
                }
            ]);

            const scategory = scategories.find(cat => cat.transactionTypes.includes(TransactionType.LOAN_PRINCIPAL))
            let transaction = {
                type: TransactionType.LOAN_PRINCIPAL,
                amount: req.body.loanPrincipal,
                from: req.body.from,
                to: space._id,
                date: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`,
                note: "",
                pcategory: scategory?.parentCategoryId,
                scategory: scategory?.subCategoryId,
                userId: userId,
                spaceId: space._id,
            }
            await Transaction.create(transaction)
        } else if (req.body.type == SpaceType.SAVING_GOAL) {
            const scategories = await Cat.aggregate([
                { $match: { spaces: SpaceType.SAVING_GOAL } },

                { $unwind: "$subCategories" },

                {
                    $project: {
                        parentCategoryId: "$_id",
                        parentCategory: 1,
                        subCategoryId: "$subCategories._id",
                        subCategoryName: "$subCategories.name",
                        transactionTypes: "$subCategories.transactionTypes"
                    }
                }
            ]);

            const scategory = scategories.find(cat => cat.transactionTypes.includes(TransactionType.SAVING))
            let transaction = {
                type: TransactionType.SAVING,
                amount: req.body.savedAlready,
                from: req.body.from,
                to: space._id,
                date: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`,
                note: "",
                pcategory: scategory?.parentCategoryId,
                scategory: scategory?.subCategoryId,
                userId: userId,
                spaceId: space._id,
            }
            await Transaction.create(transaction)
        }

        const spaces = await Space.find(
            { ownerId: userId },
            { name: 1, type: 1 }
        )

        res.status(201).json({
            success: true,
            data: {
                object: spaces,
                message: 'Space created successfully'
            },
            error: null
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            success: false,
            error: { message: 'Error creating space: ' + errorMessage },
            data: null
        });
    }

})

spaceRouter.put('/:id', authenticate, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId: string = (req as any).user.id;
        let spaceModal: any = null

        const existingSpace = Space.findOne({ _id: id, ownerId: userId });
        if (!existingSpace) {
            res.status(404).json({
                success: false,
                error: { message: 'Space not Found' },
                data: null
            });
            return;
        }

        if (req.body.type == SpaceType.CREDIT_CARD) {
            spaceModal = {
                type: req.body.type,
                name: req.body.name,
                ownerId: userId,
                isDefault: false,
                creditCardLimit: req.body.creditCardLimit,
                creditCardStatementDate: req.body.statementDate,
                creditCardDueDate: req.body.dueDate,
            }
        } else if (req.body.type == SpaceType.LOAN_BORROWED || req.body.type == SpaceType.LOAN_LENT) {
            spaceModal = {
                type: req.body.type,
                name: req.body.name,
                ownerId: userId,
                isDefault: false,
                loanPrincipal: req.body.loanPrincipal,
                loanStartDate: req.body.loanStartDate,
                loanEndDate: req.body.loanEndDate
            }
        } else if (req.body.type == SpaceType.SAVING_GOAL) {
            spaceModal = {
                type: req.body.type,
                name: req.body.name,
                ownerId: userId,
                isDefault: false,
                targetAmount: req.body.targetAmount,
                desiredDate: req.body.desiredDate,
            }
        } else {
            spaceModal = {
                type: req.body.type,
                name: req.body.name,
                ownerId: userId,
                isDefault: false,
            }
        }

        await Space.updateOne({ _id: id }, { $set: spaceModal })
        const today = new Date()

        if (req.body.type == SpaceType.LOAN_BORROWED) {
            const scategories = await Cat.aggregate([
                { $match: { spaces: SpaceType.LOAN_BORROWED } },

                { $unwind: "$subCategories" },

                {
                    $project: {
                        parentCategoryId: "$_id",
                        parentCategory: 1,
                        subCategoryId: "$subCategories._id",
                        subCategoryName: "$subCategories.name",
                        transactionTypes: "$subCategories.transactionTypes"
                    }
                }
            ]);

            const scategory = scategories.find(cat => cat.transactionTypes.includes(TransactionType.LOAN_PRINCIPAL))

            const existingTransaction = await Transaction.findOne({
                from: id,
                type: TransactionType.LOAN_PRINCIPAL
            })

            if (!existingTransaction) {
                res.status(404).json({
                    success: false,
                    error: { message: 'Transaction not Found' },
                    data: null
                });
                return;
            }

            let transaction = {
                type: TransactionType.LOAN_PRINCIPAL,
                amount: req.body.loanPrincipal,
                to: req.body.to,
                from: id,
                date: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`,
                note: "",
                pcategory: scategory?.parentCategoryId,
                scategory: scategory?.subCategoryId,
                userId: userId,
                spaceId: req.body.spaceId,
            }

            await Transaction.updateOne({ _id: existingTransaction._id }, { $set: transaction })
        } else if (req.body.type == SpaceType.LOAN_LENT) {
            const scategories = await Cat.aggregate([
                { $match: { spaces: SpaceType.LOAN_LENT } },

                { $unwind: "$subCategories" },

                {
                    $project: {
                        parentCategoryId: "$_id",
                        parentCategory: 1,
                        subCategoryId: "$subCategories._id",
                        subCategoryName: "$subCategories.name",
                        transactionTypes: "$subCategories.transactionTypes"
                    }
                }
            ]);

            const scategory = scategories.find(cat => cat.transactionTypes.includes(TransactionType.LOAN_PRINCIPAL))

            const existingTransaction = await Transaction.findOne({
                to: id,
                type: TransactionType.LOAN_PRINCIPAL
            })

            if (!existingTransaction) {
                res.status(404).json({
                    success: false,
                    error: { message: 'Transaction not Found' },
                    data: null
                });
                return;
            }

            let transaction = {
                type: TransactionType.LOAN_PRINCIPAL,
                amount: req.body.loanPrincipal,
                from: req.body.from,
                to: id,
                date: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`,
                note: "",
                pcategory: scategory?.parentCategoryId,
                scategory: scategory?.subCategoryId,
                userId: userId,
                spaceId: req.body.spaceId,
            }
            await Transaction.updateOne({ _id: existingTransaction._id }, { $set: transaction })
        }

        const spaces = await Space.find(
            { ownerId: userId },
            { name: 1, type: 1 }
        )

        res.status(201).json({
            success: true,
            data: {
                object: spaces,
                message: 'Space edited successfully'
            },
            error: null
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            success: false,
            error: { message: 'Error editing space: ' + errorMessage },
            data: null
        });
    }

})

spaceRouter.delete('/:id', authenticate, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId: string = (req as any).user.id;

        const existingSpace = Space.findOne({ _id: id, ownerId: userId });
        if (!existingSpace) {
            res.status(404).json({
                success: false,
                error: { message: 'Space not Found' },
                data: null
            });
            return;
        }

        await Transaction.deleteMany({
            $and: [
                { userId: userId },
                {
                    $or: [
                        { from: id },
                        { to: id }
                    ]
                }
            ]
        })

        await Space.deleteOne({ _id: id })
        res.status(200).json({
            success: true,
            data: {
                message: 'Space deleted successfully'
            },
            error: null
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            success: false,
            error: { message: 'Error deleting space: ' + errorMessage },
            data: null
        });
    }

})

spaceRouter.get('/user', authenticate, async (req: Request, res: Response) => {
    try {
        const userId: string = (req as any).user.id;
        const spaces = await Space.find(
            { ownerId: userId },
        )
        res.status(200).json({
            success: true,
            data: {
                object: spaces,
                message: 'Space retrived successfully!'
            },
            error: null
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            success: false,
            error: { message: 'Error finding spaces: ' + errorMessage },
            data: null
        });
    }
})

export default spaceRouter;

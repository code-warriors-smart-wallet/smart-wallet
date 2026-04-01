import express, { Request, Response } from 'express';
import Schedule, { Frequency, RecurringApproval } from '../models/schedule';
import { authenticate } from '../middlewares/auth';
import Transaction, { MemberStatus, TransactionType } from '../models/transaction';
import Space, { SpaceType } from '../models/space';
import LoanRepaymentPlan from '../models/loan-repayment-plan';
import LoanInstallment, { ILoanInstallment, InstallmentStatus } from '../models/loan-installment';
import { getNextDueDate } from '../utils/schedule.util';
import { getUsersBySpace } from './transaction';
import mongoose, { Types } from 'mongoose';
import Cat from '../models/category';

const loanRepaymentPlanRouter = express.Router();
const ObjectId = Types.ObjectId;

export enum LoanPaymentType {
    INTEREST_ONLY = "INTEREST_ONLY",
    PRINCIPAL_ONLY = "PRINCIPAL_ONLY",
    INTEREST_AND_PRINCIPAL = "INTEREST_AND_PRINCIPAL",
    PENALTY = "PENALTY",
}

loanRepaymentPlanRouter.get('/:spaceid', authenticate, async (req: Request, res: Response) => {
    try {

        const { spaceid } = req.params;
        const userId: string = (req as any).user.id;

        const loanInfo = await Space.findOne({
            _id: spaceid,
            ownerId: userId
        }).lean();

        let loanRepaymentPlan = await LoanRepaymentPlan.find({
            spaceId: new ObjectId(spaceid)
        });

        let installments: ILoanInstallment[] = [];
        if (loanRepaymentPlan) {
            installments = await LoanInstallment.find({
                spaceId: new ObjectId(spaceid)
            }).sort({ startDate: 1 });
        }

        let categories = []
        let principal = 0
        let interest = 0

        if (loanInfo && loanInfo.type === SpaceType.LOAN_LENT) {
            categories = await Cat.aggregate([
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
            const principalCategoryId = categories.find(cat => cat.subCategoryName === "Principal Repayment").subCategoryId;
            const interestCategoryId = categories.find(cat => cat.subCategoryName === "Interest").subCategoryId;

            const principalObj = await Transaction.aggregate([
                {
                    $match: {
                        from: new ObjectId(spaceid),
                        type: TransactionType.REPAYMENT_RECEIVED,
                        scategory: principalCategoryId
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
            principal = principalObj.length > 0 ? principalObj[0]?.amount : 0;

            const interestObj = await Transaction.aggregate([
                {
                    $match: {
                        from: new ObjectId(spaceid),
                        type: TransactionType.REPAYMENT_RECEIVED,
                        scategory: interestCategoryId
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
            interest = interestObj.length > 0 ? interestObj[0]?.amount : 0;
        } else {
            categories = await Cat.aggregate([
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
            const principalCategoryId = categories.find(cat => cat.subCategoryName === "Principal Repayment").subCategoryId;
            const interestCategoryId = categories.find(cat => cat.subCategoryName === "Interest").subCategoryId;

            const principalObj = await Transaction.aggregate([
                {
                    $match: {
                        from: new ObjectId(spaceid),
                        type: TransactionType.REPAYMENT_PAID,
                        scategory: principalCategoryId
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
            principal = principalObj.length > 0 ? principalObj[0]?.amount : 0;

            const interestObj = await Transaction.aggregate([
                {
                    $match: {
                        from: new ObjectId(spaceid),
                        type: TransactionType.REPAYMENT_PAID,
                        scategory: interestCategoryId
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
            interest = interestObj.length > 0 ? interestObj[0]?.amount : 0;
        }

        res.status(200).json({
            success: true,
            data: {
                object: {
                    loanInfo: loanInfo ? {...loanInfo, principalPaid: principal, interestPaid: interest} : {},
                    loanRepaymentPlan: loanRepaymentPlan.length > 0 ? loanRepaymentPlan[0] : {},
                    installments,
                },
                message: 'Loan info retrieved successfully!'
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

loanRepaymentPlanRouter.post('/', authenticate, async (req: Request, res: Response) => {
    try {
        const userId: string = (req as any).user.id;
        const { installments, loanRepaymentPlan } = req.body

        const loanRepaymentPlanSaved = await LoanRepaymentPlan.create(loanRepaymentPlan)

        await Promise.all(
            installments.map((installment: any) =>
                LoanInstallment.create({
                    ...installment,
                    loanRepaymentPlanId: loanRepaymentPlanSaved._id
                })
            )
        );

        res.status(201).json({
            success: true,
            data: {
                object: { loanRepaymentPlanSaved, installments },
                message: 'Loan repayment plan created successfully'
            },
            error: null
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            success: false,
            error: { message: 'Error creating Loan repayment plan: ' + errorMessage },
            data: null
        });
    }

})

loanRepaymentPlanRouter.post('/pay/:planId', authenticate, async (req: Request, res: Response) => {
    try {
        const userId: string = (req as any).user.id;
        const { installmentNumber, interest, principal, penalty, from, to, date } = req.body
        const { planId } = req.params;

        let installment = await LoanInstallment.find({
            $and: [
                { installmentNumber: installmentNumber },
                { loanRepaymentPlanId: new ObjectId(planId) }
            ]
        });

        if (installment.length > 0) {
            let _installment = installment[0]
            _installment.interestPaid = _installment.interestPaid + interest
            _installment.principalPaid = _installment.principalPaid + principal
            _installment.penaltyPaid = _installment.penaltyPaid + penalty
            _installment.totalPayment = _installment.interestPaid + interest + installment[0].principalPaid + principal
            _installment.remainingBalance = _installment.principalAmount - (installment[0].principalPaid + principal)
            _installment.status = _installment.interestPaid + installment[0].principalPaid >= _installment.principalAmount + _installment.interestAmount
                ? InstallmentStatus.PAID
                : _installment.interestPaid + installment[0].principalPaid > 0 ? InstallmentStatus.PARTIAL
                    : InstallmentStatus.PENDING

            let categories = null
            console.log(">>>>", from, to)
            if (from && from !== "") {
                categories = await Cat.aggregate([
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
            } else {
                categories = await Cat.aggregate([
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
            }

            if (interest > 0) {
                const pcategory = categories[0].parentCategoryId
                const scategory = categories.find(cat => cat.subCategoryName === "Interest").subCategoryId
                const transaction = {
                    type: from ? TransactionType.REPAYMENT_PAID : TransactionType.REPAYMENT_RECEIVED,
                    amount: interest,
                    from: from ? from : _installment.spaceId,
                    to: to ? to : _installment.spaceId,
                    date: date,
                    note: `Installment ${installmentNumber} payment`,
                    pcategory: pcategory,
                    scategory: scategory,
                    userId: userId,
                    spaceId: _installment.spaceId,
                    loanRepaymentPlanId: _installment.loanRepaymentPlanId
                }
                await Transaction.create(transaction)
            }

            if (principal > 0) {
                const pcategory = categories[0].parentCategoryId
                const scategory = categories.find(cat => cat.subCategoryName === "Principal Repayment").subCategoryId
                const transaction = {
                    type: from ? TransactionType.REPAYMENT_PAID : TransactionType.REPAYMENT_RECEIVED,
                    amount: principal,
                    from: from ? from : _installment.spaceId,
                    to: to ? to : _installment.spaceId,
                    date: date,
                    note: `Installment ${installmentNumber} payment`,
                    pcategory: pcategory,
                    scategory: scategory,
                    userId: userId,
                    spaceId: _installment.spaceId,
                    loanRepaymentPlanId: _installment.loanRepaymentPlanId
                }
                await Transaction.create(transaction)
            }

            if (penalty > 0) {
                const pcategory = categories[0].parentCategoryId
                const scategory = categories.find(cat => cat.subCategoryName === "Penalty").subCategoryId
                const transaction = {
                    type: TransactionType.LOAN_CHARGES,
                    amount: penalty,
                    from: from ? from : _installment.spaceId,
                    to: to ? to : _installment.spaceId,
                    date: date,
                    note: `Installment ${installmentNumber} payment`,
                    pcategory: pcategory,
                    scategory: scategory,
                    userId: userId,
                    spaceId: _installment.spaceId,
                    loanRepaymentPlanId: _installment.loanRepaymentPlanId
                }
                await Transaction.create(transaction)
            }

            await _installment.save();

            res.status(201).json({
                success: true,
                data: {
                    object: {},
                    message: 'Paid successfully'
                },
                error: null
            });
        } else {
            res.status(201).json({
                success: false,
                data: {
                    object: {},
                    message: 'Invalid installment'
                },
                error: null
            });
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            success: false,
            error: { message: 'Error creating Loan repayment plan: ' + errorMessage },
            data: null
        });
    }

})

loanRepaymentPlanRouter.get('/transactions/:planId/:installmentNumber', authenticate, async (req: Request, res: Response) => {
    try {
        const userId: string = (req as any).user.id;
        const { planId, installmentNumber } = req.params;

        let transactions = await Transaction.find({
            $and: [
                { note: `Installment ${installmentNumber} payment` },
                { loanRepaymentPlanId: new ObjectId(planId) }
            ]
        }).sort({ date: 1 });

        res.status(200).json({
            success: true,
            data: {
                object: {
                    transactions
                },
                message: 'Loan info retrieved successfully!'
            },
            error: null
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            success: false,
            error: { message: 'Error creating Loan repayment plan: ' + errorMessage },
            data: null
        });
    }

})

loanRepaymentPlanRouter.put('/transactions', authenticate, async (req: Request, res: Response) => {
    try {
        const userId: string = (req as any).user.id;
        const { planId, installmentNumber, amount, type, transactionId } = req.body;

        let transaction = await Transaction.findById(transactionId)

        if (transaction) {
            let installment = await LoanInstallment.findOne({
                $and: [
                    { installmentNumber: installmentNumber },
                    { loanRepaymentPlanId: new ObjectId(planId) }
                ]
            });

            if (installment) {
                if (type === LoanPaymentType.INTEREST_ONLY) {
                    installment.interestPaid = installment?.interestPaid - Number(amount)

                } else if (type === LoanPaymentType.PRINCIPAL_ONLY) {
                    installment.principalPaid = installment?.principalPaid - Number(amount)
                } else if (type === LoanPaymentType.PENALTY) {
                    installment.penaltyPaid = installment?.penaltyPaid - Number(amount)
                }

                if (installment.interestPaid === 0 && installment.principalPaid === 0) {
                    installment.status = InstallmentStatus.PENDING
                } else {
                    installment.status = InstallmentStatus.PARTIAL
                }
                await installment.save();
                await Transaction.deleteOne({ _id: transactionId });

                res.status(200).json({
                    success: true,
                    data: {
                        message: 'Payment deleted succssfully!'
                    },
                    error: null
                });
            } else {
                res.status(401).json({
                    success: false,
                    error: { message: "Installment not found" },
                    data: null
                });
            }
        } else {
            res.status(401).json({
                success: false,
                error: { message: "Transaction not found: " + transactionId },
                data: null
            });
        }



    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            success: false,
            error: { message: 'Error creating Loan repayment plan: ' + errorMessage },
            data: null
        });
    }

})

loanRepaymentPlanRouter.put('/plan', authenticate, async (req: Request, res: Response) => {
    try {
        const userId: string = (req as any).user.id;
        const { loanRepaymentPlanId, transactionDelFlag } = req.body;

        const result1 = await LoanInstallment.deleteMany({ loanRepaymentPlanId: new ObjectId(loanRepaymentPlanId) });
        // if (result1.deletedCount == 0) {
        //     res.status(401).json({
        //         success: false,
        //         error: { message: "Installment not found: " + loanRepaymentPlanId },
        //         data: null
        //     });
        // }
        const result2 = await LoanRepaymentPlan.deleteOne({ _id: new ObjectId(loanRepaymentPlanId) });
        if (result2.deletedCount == 0) {
            res.status(401).json({
                success: false,
                error: { message: "Plan not found: " + loanRepaymentPlanId },
                data: null
            });
        }

        if (transactionDelFlag) {
            const result3 = await Transaction.deleteMany({ loanRepaymentPlanId: new ObjectId(loanRepaymentPlanId) });
            if (result3.deletedCount == 0) {
                res.status(401).json({
                    success: false,
                    error: { message: "Transaction not found: " + loanRepaymentPlanId },
                    data: null
                });
            }
        } else {
            let transactions = await Transaction.find({
                loanRepaymentPlanId: new ObjectId(loanRepaymentPlanId)
            })

            await Promise.all(
                transactions.map((t: any) =>
                    Transaction.updateOne(
                        { _id: t._id },             // filter: which doc
                        { $set: { loanRepaymentPlanId: null } } // update: only this field
                    )
                )
            );
        }

        res.status(200).json({
            success: true,
            data: {
                message: 'Plan deleted succssfully!'
            },
            error: null
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            success: false,
            error: { message: 'Error creating Loan repayment plan: ' + errorMessage },
            data: null
        });
    }

})

export default loanRepaymentPlanRouter;
import express, { Request, Response } from 'express';
import LoanRepaymentPlan from '../models/loanRepaymentPlan';
import LoanInstallment from '../models/loanInstallment';
import Transaction from '../models/transaction';
import Space, { SpaceType } from '../models/space';
import { authenticate } from '../middlewares/auth';
import { calculateInstallments } from '../utils/loanCalculation.util';
import { Types } from 'mongoose';

const loanRepaymentPlanRouter = express.Router();

// Create a new loan repayment plan
loanRepaymentPlanRouter.post('/', authenticate, async (req: Request, res: Response) => {
    try {
        const { 
            spaceId, 
            loanAmount, 
            startDate, 
            endDate, 
            interestRate, 
            interestPeriod,
            interestType,
            paymentFrequency,
            firstPaymentDate 
        } = req.body;

        // Check if space exists and user has access
        const space = await Space.findOne({ _id: spaceId });
        if (!space) {
            res.status(404).json({
                success: false,
                error: { message: 'Space not found' },
                data: null
            });
            return;
        }

        // Check if plan already exists
        const existingPlan = await LoanRepaymentPlan.findOne({ spaceId });
        if (existingPlan) {
            res.status(400).json({
                success: false,
                error: { message: 'A repayment plan already exists for this space' },
                data: null
            });
            return;
        }

        // Convert interest rate to monthly if yearly
        let monthlyInterestRate = interestRate;
        if (interestPeriod === 'yearly' && interestRate > 0) {
            monthlyInterestRate = interestRate / 12;
        }

        // Map payment frequency to months
        const frequencyMap: { [key: string]: number } = {
            'WEEKLY': 0.25,
            'BI_WEEKLY': 0.5,
            'MONTHLY': 1,
            'BI_MONTHLY': 2,
            'QUARTERLY': 3,
            'SEMI_ANNUALLY': 6,
            'ANNUALLY': 12
        };

        const monthsPerInstallment = frequencyMap[paymentFrequency];

        // Create loan repayment plan
        const plan = await LoanRepaymentPlan.create({
            spaceId,
            monthsPerInstallment,
            firstPaymentDate,
            monthlyInterestRate: monthlyInterestRate || 0,
            totalInterest: 0 // Will be calculated and updated after installments
        });

        const planId = (plan._id as Types.ObjectId).toString();

        // Calculate and create installments
        const installments = await calculateInstallments({
            spaceId,
            planId: planId,
            loanAmount,
            startDate,
            endDate,
            firstPaymentDate,
            monthsPerInstallment,
            monthlyInterestRate: monthlyInterestRate || 0,
            interestType
        });

        // Calculate total interest
        const totalInterest = installments.reduce((sum, inst) => sum + inst.interestAmount, 0);
        await LoanRepaymentPlan.findByIdAndUpdate(plan._id, { totalInterest });

        // Update space with loan details if they were changed
        await Space.findByIdAndUpdate(spaceId, {
            loanPrincipal: loanAmount,
            loanStartDate: startDate,
            loanEndDate: endDate
        });

        res.status(201).json({
            success: true,
            data: {
                object: { plan, installments },
                message: 'Loan repayment plan created successfully'
            },
            error: null
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            success: false,
            error: { message: 'Error creating loan repayment plan: ' + errorMessage },
            data: null
        });
    }
});

loanRepaymentPlanRouter.put('/:id', authenticate, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { 
            spaceId, 
            loanAmount, 
            startDate, 
            endDate, 
            interestRate, 
            interestPeriod,
            interestType,
            paymentFrequency,
            firstPaymentDate 
        } = req.body;

        // Check if plan exists
        const existingPlan = await LoanRepaymentPlan.findById(id);
        if (!existingPlan) {
            res.status(404).json({
                success: false,
                error: { message: 'Plan not found' },
                data: null
            });
            return;
        }

        // Check if any payments have been made
        const installments = await LoanInstallment.find({ loanRepaymentPlanId: id });
        const hasAnyPayment = installments.some(inst => 
            inst.principalPaid > 0 || inst.interestPaid > 0 || inst.penaltyPaid > 0
        );

        if (hasAnyPayment) {
            res.status(400).json({
                success: false,
                error: { message: 'Cannot edit plan after first payment. Please delete and create a new plan.' },
                data: null
            });
            return;
        }

        // Check if space exists
        const space = await Space.findOne({ _id: spaceId });
        if (!space) {
            res.status(404).json({
                success: false,
                error: { message: 'Space not found' },
                data: null
            });
            return;
        }

        // Convert interest rate to monthly if yearly
        let monthlyInterestRate = interestRate;
        if (interestPeriod === 'yearly' && interestRate > 0) {
            monthlyInterestRate = interestRate / 12;
        }

        // Map payment frequency to months
        const frequencyMap: { [key: string]: number } = {
            'WEEKLY': 0.25,
            'BI_WEEKLY': 0.5,
            'MONTHLY': 1,
            'BI_MONTHLY': 2,
            'QUARTERLY': 3,
            'SEMI_ANNUALLY': 6,
            'ANNUALLY': 12
        };

        const monthsPerInstallment = frequencyMap[paymentFrequency];

        // DELETE ALL EXISTING RECORDS
        // 1. Delete all installments
        await LoanInstallment.deleteMany({ loanRepaymentPlanId: id });
        
        // 2. Delete all related transactions
        await Transaction.deleteMany({ loanRepaymentPlanId: id });

        // 3. Update the plan with new data
        const updatedPlan = await LoanRepaymentPlan.findByIdAndUpdate(
            id,
            {
                monthsPerInstallment,
                firstPaymentDate,
                monthlyInterestRate: monthlyInterestRate || 0,
                totalInterest: 0
            },
            { new: true }
        );

        // 4. Create new installments
        const newInstallments = await calculateInstallments({
            spaceId,
            planId: id,
            loanAmount,
            startDate,
            endDate,
            firstPaymentDate,
            monthsPerInstallment,
            monthlyInterestRate: monthlyInterestRate || 0,
            interestType
        });

        // 5. Calculate and update total interest
        const totalInterest = newInstallments.reduce((sum, inst) => sum + inst.interestAmount, 0);
        await LoanRepaymentPlan.findByIdAndUpdate(id, { totalInterest });

        // 6. Update space with loan details
        await Space.findByIdAndUpdate(spaceId, {
            loanPrincipal: loanAmount,
            loanStartDate: startDate,
            loanEndDate: endDate
        });

        res.status(200).json({
            success: true,
            data: {
                object: { plan: updatedPlan, installments: newInstallments },
                message: 'Loan repayment plan updated successfully'
            },
            error: null
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            success: false,
            error: { message: 'Error updating loan repayment plan: ' + errorMessage },
            data: null
        });
    }
});

// Get plan by space ID
loanRepaymentPlanRouter.get('/space/:spaceId', authenticate, async (req: Request, res: Response) => {
    try {
        const { spaceId } = req.params;

        const plan = await LoanRepaymentPlan.findOne({ spaceId });

        res.status(200).json({
            success: true,
            data: {
                object: plan,
                message: 'Plan retrieved successfully'
            },
            error: null
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            success: false,
            error: { message: 'Error getting plan: ' + errorMessage },
            data: null
        });
    }
});

loanRepaymentPlanRouter.get('/:planId/with-space', authenticate, async (req: Request, res: Response) => {
    try {
        const { planId } = req.params;

        // Get the plan
        const plan = await LoanRepaymentPlan.findById(planId);
        if (!plan) {
            res.status(404).json({
                success: false,
                error: { message: 'Plan not found' },
                data: null
            });
            return;
        }

        // Get the associated space
        const space = await Space.findById(plan.spaceId);
        if (!space) {
            res.status(404).json({
                success: false,
                error: { message: 'Associated space not found' },
                data: null
            });
            return;
        }

        // Combine plan and space data
        const planWithSpaceDetails = {
            ...plan.toObject(),
            loanAmount: space.loanPrincipal ? parseFloat(space.loanPrincipal.toString()) : 0,
            startDate: space.loanStartDate,
            endDate: space.loanEndDate,
            spaceName: space.name,
            spaceType: space.type
        };

        res.status(200).json({
            success: true,
            data: {
                object: planWithSpaceDetails,
                message: 'Plan with space details retrieved successfully'
            },
            error: null
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            success: false,
            error: { message: 'Error getting plan with space details: ' + errorMessage },
            data: null
        });
    }
});

// Get installments by plan ID
loanRepaymentPlanRouter.get('/:planId/installments', authenticate, async (req: Request, res: Response) => {
    try {
        const { planId } = req.params;

        const installments = await LoanInstallment.find({ loanRepaymentPlanId: planId })
            .sort({ startDate: 1 });

        res.status(200).json({
            success: true,
            data: {
                object: installments,
                message: 'Installments retrieved successfully'
            },
            error: null
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            success: false,
            error: { message: 'Error getting installments: ' + errorMessage },
            data: null
        });
    }
});

// Get all plans for user (for All Spaces view)
loanRepaymentPlanRouter.get('/user/all', authenticate, async (req: Request, res: Response) => {
    try {
        const userId: string = (req as any).user.id;

        // Get all loan spaces for user
        const spaces = await Space.find({
            ownerId: userId,
            type: { $in: [SpaceType.LOAN_LENT, SpaceType.LOAN_BORROWED] }
        });

        const spaceIds = spaces.map(s => s._id);

        // Get plans for these spaces
        const plans = await LoanRepaymentPlan.find({ spaceId: { $in: spaceIds } })
            .populate('spaceId');

        // Get installments for each plan
        const plansWithInstallments = await Promise.all(
            plans.map(async (plan) => {
                const installments = await LoanInstallment.find({ 
                    loanRepaymentPlanId: plan._id 
                });
                return {
                    ...plan.toObject(),
                    installments
                };
            })
        );

        res.status(200).json({
            success: true,
            data: {
                object: plansWithInstallments,
                message: 'Plans retrieved successfully'
            },
            error: null
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            success: false,
            error: { message: 'Error getting plans: ' + errorMessage },
            data: null
        });
    }
});

// Delete plan
loanRepaymentPlanRouter.delete('/:id', authenticate, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Delete all related installments
        await LoanInstallment.deleteMany({ loanRepaymentPlanId: id });

        // Delete all related transactions
        await Transaction.deleteMany({ loanRepaymentPlanId: id });

        // Delete the plan
        await LoanRepaymentPlan.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            data: {
                message: 'Loan repayment plan deleted successfully'
            },
            error: null
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            success: false,
            error: { message: 'Error deleting plan: ' + errorMessage },
            data: null
        });
    }
});

export default loanRepaymentPlanRouter;
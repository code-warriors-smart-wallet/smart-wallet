import express, { Request, Response } from 'express';
import LoanInstallment from '../models/loanInstallment';
import { authenticate } from '../middlewares/auth';
import { InstallmentStatus } from '../models/loanRepaymentPlan';

const loanInstallmentRouter = express.Router();

// Update installment (payment)
loanInstallmentRouter.put('/:id', authenticate, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { principalPaid, interestPaid, penaltyPaid, status } = req.body;

        const updateData: any = {};
        if (principalPaid !== undefined) updateData.principalPaid = principalPaid;
        if (interestPaid !== undefined) updateData.interestPaid = interestPaid;
        if (penaltyPaid !== undefined) updateData.penaltyPaid = penaltyPaid;
        if (status) updateData.status = status;

        const installment = await LoanInstallment.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        );

        res.status(200).json({
            success: true,
            data: {
                object: installment,
                message: 'Installment updated successfully'
            },
            error: null
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            success: false,
            error: { message: 'Error updating installment: ' + errorMessage },
            data: null
        });
    }
});

// Add penalty to installment
loanInstallmentRouter.put('/:id/penalty', authenticate, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { penaltyAmount } = req.body;

        const installment = await LoanInstallment.findById(id);
        if (!installment) {
            res.status(404).json({
                success: false,
                error: { message: 'Installment not found' },
                data: null
            });
            return;
        }

        installment.penaltyAmount = penaltyAmount;
        await installment.save();

        res.status(200).json({
            success: true,
            data: {
                object: installment,
                message: 'Penalty added successfully'
            },
            error: null
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            success: false,
            error: { message: 'Error adding penalty: ' + errorMessage },
            data: null
        });
    }
});

export default loanInstallmentRouter;
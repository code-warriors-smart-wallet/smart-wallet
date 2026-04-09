import express, { Request, Response } from 'express';
import Plan from '../models/plan';
import { seedPlans } from '../utils/seed';

const planRouter = express.Router();

planRouter.get('/all', async (req: Request, res: Response) => {
    try {
        let plansData = await Plan.find({ active: true });
        if (!plansData || plansData.length === 0) {
            await seedPlans();
            plansData = await Plan.find({ active: true });
        }

        res.status(200).json({
            success: true,
            data: {
                object: plansData,
                count: plansData.length,
                message: 'Plans retrieved successfully'
            },
            error: null
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            success: false,
            error: { message: 'Error retrieving plans: ' + errorMessage },
            data: null
        });
    }
});

planRouter.post('/seed', async (req: Request, res: Response) => {
    try {
        // Deactivate all existing plans first
        await Plan.updateMany({}, { active: false });

        const plansData = [
            {
                name: "Starter",
                description: "Start simple. Stay in control",
                monthly_price: 0,
                yearly_price: 0,
                currency: "LKR",
                features: [
                    "Track cash & bank accounts",
                    "View all transactions & dashboard",
                    "Use predefined categories",
                    "Manage up to 5 spaces per account",
                    "One-time schedules and budgets"
                ],
                active: true
            },
            {
                name: "Plus",
                description: "Unlock the full power of your money",
                monthly_price: 1999,
                yearly_price: 19990,
                currency: "LKR",
                features: [
                    "Cash, Bank, Credit Cards, Loans, Savings, Shared accounts",
                    "View all transactions & dashboard",
                    "Create custom categories",
                    "Unlimited spaces",
                    "Recurring schedules & budgets",
                    "Manage loan repayment plans",
                    "Use AI assistant for smart insights & queries",
                    "Access detailed reports & analytics"
                ],
                active: true
            }
        ];

        for (const plan of plansData) {
            await Plan.findOneAndUpdate(
                { name: plan.name },
                { $set: plan },
                { upsert: true, new: true }
            );
        }

        res.status(200).json({
            success: true,
            data: { message: 'Plans consolidated successfully to Starter and Plus tiers' },
            error: null
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            success: false,
            error: { message: 'Error seeding plans: ' + errorMessage },
            data: null
        });
    }
});


export default planRouter;
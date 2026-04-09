import Plan, { PlanType } from '../models/plan';

export const seedPlans = async () => {
    try {
        const plansData = [
            {
                name: PlanType.STARTER,
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
                name: PlanType.PLUS,
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

        console.log(">>>> Seeding plans...");
        for (const planData of plansData) {
            await Plan.findOneAndUpdate(
                { name: planData.name },
                { $set: planData },
                { upsert: true, new: true }
            );
        }
        console.log(">>>> Plans seeded successfully.");
    } catch (error) {
        console.error(">>>> Error seeding plans:", error);
    }
};

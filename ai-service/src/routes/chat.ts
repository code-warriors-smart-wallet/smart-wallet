import express, { Request, Response } from 'express';
import { authenticate } from '../middlewares/auth';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Space from '../models/space';
import Transaction from '../models/transaction';
import Budget from '../models/budget';
import Category from '../models/category';
import Schedule from '../models/schedule';

const router = express.Router();

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const SYSTEM_INSTRUCTION = `You are "Smart Wallet AI", a friendly, expert personal financial advisor built into the Smart Wallet app. 
You have access to the user's REAL financial data which will be provided as context.

Your responsibilities:
- Analyze the user's transactions, budgets, and accounts to give personalized advice
- Help them understand their spending patterns and suggest improvements
- Answer questions about their finances using the provided data
- Provide budget optimization tips based on their actual spending
- Be encouraging and supportive about their financial journey
- Give specific, actionable advice, not generic tips

Formatting rules:
- Use markdown formatting for readability
- Use **bold** for key numbers and important points
- Use bullet points for lists
- Keep responses concise but insightful (2-4 paragraphs max unless asked for detail)
- Use emoji sparingly for friendliness (📊💰📈💡)

Important:
- Always base your analysis on the actual data provided
- If the data shows concerning patterns (overspending, no budgets), gently point them out
- Never hallucinate or make up numbers — only reference data that was provided
- If you don't have enough data to answer, say so honestly
- Currency values should use the user's currency shown in the data`;

interface ChatMessage {
    role: 'user' | 'model';
    parts: string;
}

// Helper to format Decimal128 values
function formatDecimal(val: any): number {
    if (!val) return 0;
    if (typeof val === 'object' && val.toString) {
        return parseFloat(val.toString());
    }
    return parseFloat(val) || 0;
}

// Helper to get user's financial summary
async function getUserFinancialContext(userId: string): Promise<string> {
    try {
        // Get user's spaces (accounts)
        const spaces = await Space.find({ ownerId: userId });
        
        // Get transactions from last 60 days
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
        const transactions = await Transaction.find({
            userId: userId,
            date: { $gte: sixtyDaysAgo }
        }).populate('pcategory', 'name').sort({ date: -1 }).limit(100);

        // Get active budgets
        const budgets = await Budget.find({ userId: userId }).populate('mainCategoryId', 'name');

        // Get categories
        const categories = await Category.find({
            $or: [
                { userId: userId },
                { userId: { $exists: false } }
            ]
        });

        // Get scheduled transactions
        const schedules = await Schedule.find({ userId: userId, isActive: true });

        // Build context string
        let context = `## User's Financial Data Snapshot\n\n`;

        // Accounts summary
        context += `### Accounts / Spaces\n`;
        if (spaces.length === 0) {
            context += `No accounts set up yet.\n`;
        } else {
            spaces.forEach(space => {
                context += `- **${space.name}** (${space.type})`;
                if (space.creditCardLimit) {
                    context += ` — Credit limit: ${formatDecimal(space.creditCardLimit)}`;
                }
                if (space.targetAmount) {
                    context += ` — Savings target: ${formatDecimal(space.targetAmount)}`;
                }
                if (space.loanPrincipal) {
                    context += ` — Loan principal: ${formatDecimal(space.loanPrincipal)}`;
                }
                context += `\n`;
            });
        }

        // Transaction summary
        context += `\n### Recent Transactions (Last 60 Days)\n`;
        if (transactions.length === 0) {
            context += `No transactions recorded in the last 60 days.\n`;
        } else {
            // Summary by type
            const summary: Record<string, { count: number; total: number }> = {};
            transactions.forEach(t => {
                if (!summary[t.type]) summary[t.type] = { count: 0, total: 0 };
                summary[t.type].count++;
                summary[t.type].total += formatDecimal(t.amount);
            });

            for (const [type, data] of Object.entries(summary)) {
                context += `- **${type}**: ${data.count} transactions, total: ${data.total.toFixed(2)}\n`;
            }

            // Spending by category
            context += `\n### Spending by Category (Last 60 Days)\n`;
            const categorySpending: Record<string, number> = {};
            transactions.forEach(t => {
                if (t.type === 'EXPENSE') {
                    const catName = (t.pcategory as any)?.name || 'Uncategorized';
                    if (!categorySpending[catName]) categorySpending[catName] = 0;
                    categorySpending[catName] += formatDecimal(t.amount);
                }
            });

            const sortedCategories = Object.entries(categorySpending).sort((a, b) => b[1] - a[1]);
            if (sortedCategories.length === 0) {
                context += `No expense transactions to categorize.\n`;
            } else {
                sortedCategories.forEach(([cat, amount]) => {
                    context += `- **${cat}**: ${amount.toFixed(2)}\n`;
                });
            }

            // Recent transactions (last 10)
            context += `\n### Latest 10 Transactions\n`;
            transactions.slice(0, 10).forEach(t => {
                const date = new Date(t.date as any).toLocaleDateString();
                const catName = (t.pcategory as any)?.name || '';
                context += `- ${date} | ${t.type} | ${formatDecimal(t.amount).toFixed(2)} | ${catName} | ${t.note || ''}\n`;
            });
        }

        // Budget info
        context += `\n### Active Budgets\n`;
        if (budgets.length === 0) {
            context += `No budgets set up.\n`;
        } else {
            // Calculate spending for each budget
            for (const budget of budgets) {
                const catName = (budget.mainCategoryId as any)?.name || 'Unknown';
                const budgetStart = budget.startDate || sixtyDaysAgo;
                
                // Get spending in this budget's category since budget start
                const budgetSpending = await Transaction.aggregate([
                    {
                        $match: {
                            userId: budget.userId,
                            type: 'EXPENSE',
                            pcategory: budget.mainCategoryId,
                            date: { $gte: budgetStart },
                            ...(budget.endDate ? { date: { $lte: budget.endDate } } : {})
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            total: { $sum: { $toDouble: '$amount' } }
                        }
                    }
                ]);

                const spent = budgetSpending[0]?.total || 0;
                const percentage = budget.amount > 0 ? ((spent / budget.amount) * 100).toFixed(1) : '0';
                context += `- **${budget.name}** (${catName}): Budget ${budget.amount.toFixed(2)} | Spent ${spent.toFixed(2)} | ${percentage}% used | Type: ${budget.type}\n`;
            }
        }

        // Scheduled transactions
        context += `\n### Scheduled/Recurring Transactions\n`;
        if (schedules.length === 0) {
            context += `No recurring transactions set up.\n`;
        } else {
            schedules.forEach(s => {
                context += `- ${s.type} | ${formatDecimal(s.amount).toFixed(2)} | ${s.frequency} | Next: ${s.nextDate ? new Date(s.nextDate).toLocaleDateString() : 'N/A'} | ${s.note || ''}\n`;
            });
        }

        return context;
    } catch (error) {
        console.error('Error fetching financial context:', error);
        return 'Unable to load financial data at this time. Please answer based on general financial advice.';
    }
}

// POST /chat
router.post('/chat', authenticate, async (req: Request, res: Response): Promise<void> => {
    try {
        const { message, history } = req.body;
        const userId = (req as any).user?.id || (req as any).user?._id;

        if (!message) {
            res.status(400).json({ success: false, error: { message: 'Message is required' } });
            return;
        }

        if (!process.env.GEMINI_API_KEY) {
            res.status(500).json({ success: false, error: { message: 'AI service not configured. Missing API key.' } });
            return;
        }

        // Fetch user's financial data
        const financialContext = await getUserFinancialContext(userId);

        // Build conversation history for Gemini
        const geminiHistory: { role: string; parts: { text: string }[] }[] = [];

        // Add context as the first assistant message if this is a new conversation
        if (!history || history.length === 0) {
            geminiHistory.push({
                role: 'user',
                parts: [{ text: `Here is my current financial data for context:\n\n${financialContext}\n\nPlease acknowledge you have my data and greet me briefly.` }]
            });
            geminiHistory.push({
                role: 'model',
                parts: [{ text: `I've loaded your financial data! 📊 I can see your accounts, recent transactions, budgets, and more. How can I help you with your finances today?` }]
            });
        } else {
            // First entry is always the context
            geminiHistory.push({
                role: 'user',
                parts: [{ text: `Here is my current financial data for context:\n\n${financialContext}\n\nI'll be asking you questions about my finances.` }]
            });
            geminiHistory.push({
                role: 'model',
                parts: [{ text: `I've loaded your financial data and I'm ready to help! What would you like to know?` }]
            });

            // Add conversation history
            for (const msg of history) {
                geminiHistory.push({
                    role: msg.role === 'user' ? 'user' : 'model',
                    parts: [{ text: msg.parts }]
                });
            }
        }

        // Create the model
        const model = genAI.getGenerativeModel({
            model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
            systemInstruction: SYSTEM_INSTRUCTION,
        });

        // Start chat and send message
        const chat = model.startChat({
            history: geminiHistory,
        });

        const result = await chat.sendMessage(message);
        const response = result.response;
        const text = response.text();

        res.json({
            success: true,
            data: {
                object: {
                    response: text,
                    role: 'model'
                }
            }
        });
    } catch (error: any) {
        console.error('AI Chat Error:', error);

        // Detect Gemini quota / rate-limit errors
        const errMsg: string = error?.message || '';
        const isQuota =
            error?.status === 429 ||
            errMsg.includes('RESOURCE_EXHAUSTED') ||
            errMsg.includes('Quota exceeded') ||
            errMsg.includes('rate-limit');

        if (isQuota) {
            res.status(429).json({
                success: false,
                error: {
                    message: 'The AI service has reached its rate limit. Please wait a minute and try again, or upgrade to a paid Gemini API tier.'
                }
            });
            return;
        }

        res.status(500).json({
            success: false,
            error: {
                message: error?.message || 'Failed to process your request. Please try again.'
            }
        });
    }
});

// GET /suggestions — quick suggestion chips
router.get('/suggestions', authenticate, async (_req: Request, res: Response): Promise<void> => {
    res.json({
        success: true,
        data: {
            object: [
                "How am I spending this month?",
                "Am I on track with my budgets?",
                "Where can I cut expenses?",
                "Give me a savings plan",
                "Summarize my finances",
                "What are my biggest expenses?"
            ]
        }
    });
});

export default router;

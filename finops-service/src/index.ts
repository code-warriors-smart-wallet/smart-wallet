import { initScheduleJobs } from './jobs/schedule';
import { initFinancialMonitorJobs } from './jobs/financial-monitor';
import { initTransactionReminderJobs } from './jobs/transaction-reminder';
import { seedCategories } from './models/category';

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import path from 'path';

import './models/user';
import './models/space';
import './models/category';
import './models/schedule';
import './models/transaction';

import { connectDatabase } from './config/database';
import categoryRouter from "./routes/category";
import transactionRouter from "./routes/transaction";
import scheduleRouter from "./routes/schedule";
import budgetRouter from './routes/budget';
import installmentRouter from './routes/loan-repayment-plan';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });
const PORT = process.env.PORT || 8082;
const app = express();

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true, 
}));
app.use(express.json());
app.use(cookieParser());

// Connect to database
connectDatabase()
    .then(() => {
        // Routes
        app.use("/budget", budgetRouter);
        app.use("/category", categoryRouter);
        app.use("/transaction", transactionRouter);
        app.use("/schedule", scheduleRouter);
        app.use("/installment", installmentRouter);

        // Cron jobs
        initScheduleJobs();
        initTransactionReminderJobs();
        initFinancialMonitorJobs();

        // seedCategories();

        // Start the server
        app.listen(PORT, () => {
            console.log(`Finops-service server is listening on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error('Failed to start finops-service server:', error);
        process.exit(1);
    });



// Handle unexpected errors
process.on('unhandledRejection', (error) => {
    console.error('Unhandled Promise Rejection (finops-service):', error);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception (finops-service):', error);
    process.exit(1);
});

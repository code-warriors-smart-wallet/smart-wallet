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
import dashboardRouter from "./routes/dashboard";
import reportRouter from "./routes/report";

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });
const PORT = process.env.PORT || 8084;
const app = express();

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true, 
}));
app.use(express.json());
app.use(cookieParser());

import { initSummaryJobs } from './jobs/summary-jobs';

// Connect to database
connectDatabase()
    .then(() => {
        // Routes
        app.use("/dashboard", dashboardRouter);
        app.use("/export", reportRouter)

        // Cron jobs
        initSummaryJobs();

        // Start the server
        app.listen(PORT, () => {
            console.log(`Report-service server is listening on port ${PORT}`);
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

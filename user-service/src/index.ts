import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import authRouter from "./routes/auth";
import spaceRouter from "./routes/space";
import planRouter from "./routes/plan";
import { initSubscriptionJobs } from './jobs/subscription';
import { connectDatabase } from './config/database';
import path from 'path';

// Load environment variables
dotenv.config();
const PORT = process.env.PORT || 8081;
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
        app.use("/auth", authRouter);
        app.use("/space", spaceRouter);
        app.use("/plan", planRouter);

        // Cron jobs
        initSubscriptionJobs();

        // Start the server
        app.listen(PORT, () => {
            console.log(`User service server is listening on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error('Failed to start user-service server:', error);
        process.exit(1);
    });

// Handle unexpected errors
process.on('unhandledRejection', (error) => {
    console.error('Unhandled Promise Rejection (user-service):', error);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception (user-service):', error);
    process.exit(1);
});

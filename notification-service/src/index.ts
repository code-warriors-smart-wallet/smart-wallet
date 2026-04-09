import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import emailRouter from "./routes/email";
import notificationRouter from "./routes/notification";
import { connectDatabase } from './config/database';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });
const PORT = process.env.PORT || 8083;
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
        app.use("/email", emailRouter);
        app.use("/notification", notificationRouter);

        // Cron jobs

        // Start the server
        app.listen(PORT, () => {
            console.log(`Notification service server is listening on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error('Failed to start Notification-service server:', error);
        process.exit(1);
    });

// Handle unexpected errors
process.on('unhandledRejection', (error) => {
    console.error('Unhandled Promise Rejection (Notification-service):', error);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception (user-service):', error);
    process.exit(1);
});

import { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET!;

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1];
    
    if (!token) {
       console.log(">>>> [FinOps Auth] Token not found in Authorization header");
       res.status(403).json({ success: false, error: { message: "No token provided" } });
       return;
    }

    jwt.verify(token, ACCESS_TOKEN_SECRET, (err, user: any) => {
        if (err) {
            console.log(">>>> [FinOps Auth] Token verification failed:", err.message);
            console.log(">>>> [FinOps Auth] Received token start:", token.substring(0, 15) + "...");
            res.status(403).json({ success: false, error: { message: "Token verification failed: " + err.message } });
            return;
        }
      (req as any).user = user;
      next();
   });
};
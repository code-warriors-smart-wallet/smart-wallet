import { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'smart-wallet-access-token';

/**
 * Middleware to authenticate user using JWT token from headers.
 * This allows identifying the user without requiring their ID in the URL.
 */
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
   const authHeader = req.headers['authorization'];
   const token = authHeader?.split(' ')[1];

   if (!token) {
      console.log("[AUTH] No token found");
      res.sendStatus(403);
      return;
   }

   jwt.verify(token, ACCESS_TOKEN_SECRET, (err, user: any) => {
      if (err) {
         console.log("[AUTH] Token verification failed");
         res.sendStatus(403);
         return;
      }
      // Attach user info to request (this includes the userId)
      (req as any).user = user;
      next();
   });
};
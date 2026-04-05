import { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET!;

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
   const authHeader = req.headers['authorization'];
   const token = authHeader?.split(' ')[1];
   console.log(authHeader)
   if (!token) {
      console.log("token not found")
      res.sendStatus(403);
      return;
   }

   jwt.verify(token, ACCESS_TOKEN_SECRET, (err, user: any) => {
      if (err) {
         console.log(`[FINOPS-AUTH] Token verification failed: ${err.message}`);
         res.sendStatus(403);
         return;
      }
      console.log(`[FINOPS-AUTH] Token valid for user ${user.id}`);
      (req as any).user = user;
      next();
   });
};
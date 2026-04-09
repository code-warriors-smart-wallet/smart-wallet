import { UserRole } from "../models/user";

import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET!;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET!;

let refreshTokens: string[] = [];

export const generateAccessToken = (user: { id: string, role: UserRole }) => {
  return jwt.sign(user, ACCESS_TOKEN_SECRET, { expiresIn: '120m' });
};

export const generateRefreshToken = (user: { id: string, role: UserRole }) => {
  const token = jwt.sign(user, REFRESH_TOKEN_SECRET, { expiresIn: '30d' });
  refreshTokens.push(token);
  return token;
};
import { PlanType } from "../models/plan";

export interface ApiResponse {
    success: boolean;
    data: any;
    error: {message: string, error: string} | null
}

export enum LoginStatus {
    SUCCESS,
    BLOCKED,
    INVALID_CREDENTIALS,
    VERIFICATION_REQUIRED,
    CURRENCY_REQUIRED,
    SUBSCRIPTION_REQUIRED,
    SUBSCRIPTION_EXPIRED
}

export interface LoginResponse {
    status: LoginStatus;
    username: string;
    email: string;
    currency?: string;
    subscription?: PlanType;
    accessToken?: string;
    role?: string
}
import { PlanType, UserRole } from "./modals";

export interface AuthState {
    username: string|null,
    email: string|null,
    token: string|null,
    isAuthenticated: boolean;
    OTPAttemptsRemaining: number;
    currency: string|null;
    plan: PlanType|null;
    role: UserRole|null;
    userId: string | null;
    spaces: {id: string, name: string, type: string, isCollaborative: boolean, isOwner: boolean}[]
}

export interface TransactionState {
    transactions: any[],
    loading: boolean,
    page: number,
    total: number
}

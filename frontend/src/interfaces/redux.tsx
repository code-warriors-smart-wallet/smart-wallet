import { PlanType, UserRole } from "./modals";

export interface AuthState {
    userId: string | null;
    username: string|null,
    email: string|null,
    token: string|null,
    isAuthenticated: boolean;
    OTPAttemptsRemaining: number;
    profileImgUrl: string|null;
    currency: string|null;
    plan: PlanType|null;
    role: UserRole|null;
    spaces: {id: string, name: string, type: string, isCollaborative: boolean, isOwner: boolean}[]
}

export interface TransactionState {
    transactions: any[],
    loading: boolean,
    page: number,
    total: number
}

export interface InstallmentState {
    installments: any[],
    loading: boolean,
    page: number,
    total: number,
    loanInfo: any,
    loanRepaymentPlanInfo: any,
    transactions: any[]
}

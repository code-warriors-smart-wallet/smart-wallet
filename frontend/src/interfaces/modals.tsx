import { TransactionType } from "@/components/user.portal/views/Transactions";

export interface LoginInfo {
    email: string,
    password: string
}

export interface RegistrationInfo {
    username: string,
    email: string,
    password: string,
    currency: string
}

export interface SendOtpRequest {
    email: string,
}

export interface verifyOtpRequest {
    email: string,
    otpCode: string;
}

export enum PlanType {
    STARTER = "Starter",
    PLUS = "Plus",
    PRO = "Pro"
}

export interface SubscribeRequest {
    email: string;
    planId: string;
    autoRenew: boolean;
}

export interface UpdateCurrencyRequest {
    currency: string;
    email: string;
}
export interface PlanInfo {
    _id: string;
    name: string;
    description: string;
    monthly_price: number;
    yearly_price: number;
    currency: string;
    features: string[];
    active: boolean;
}

export interface ApiResponse {
    success: boolean,
    error: { message: string } | null,
    data: { message: string, object?: any } | null
}

export enum UserRole {
    ADMIN = 'ADMIN',
    USER = 'USER'
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

export interface SpaceInfo {
    name: string,
    type: string,
    id: string,
    loanPrincipal?: number,
    loanStartDate?: string | null,
    loanEndDate?: string | null,
    creditCardLimit?: number,
    statementDate?: string | null,
    targetAmount?: number,
    savedAlready?: number,
    desiredDate?: string | null,
    dueDate?: string | null,
    from: string | null,
    to: string | null,
}

export interface TransactionInfo {
    type: string,
    amount: number,
    from: string | null,
    to: string | null,
    date: string,
    note: string,
    scategory: string | null,
    pcategory: string | null,
    scheduleId?: string | null
    spaceId?: string | undefined
}

export enum Frequency {
    ONE_TIME = "ONE_TIME",
    RECURRENT = "RECURRENT"
}

export enum Repeat {
    DAY = "DAY",
    WEEK = "WEEK",
    MONTH = "MONTH",
    YEAR = "YEAR",
}

export enum RecurringApproval {
    MANUAL = "MANUAL",
    AUTO = "AUTO",
}

export enum ContinueType {
    FOREVER = "FOREVER",
    UNTIL_A_DATE = "UNTIL_A_DATE"
}


export interface ScheduleInfo {
    type: string,
    amount: number,
    from: string | null,
    to: string | null,
    note: string,
    scategory: string | null,
    pcategory: string | null,
    frequency: string,
    startDate: string,
    repeat: string,
    interval: number,
    recurringApproval: string
    continue: ContinueType,
    endDate: string | null,
    isClosed?: boolean,
    spaceId?: string
}

interface SubCategoryInfo {
    _id: string,
    name: string;
    color: string; // hex code
}

export interface CategoryInfo {
    _id: string,
    parentCategoryId: string;
    parentCategory: string;
    subCategoryId: string;
    subCategoryName: string;
    transactionTypes: string[],
}

import mongoose from "mongoose";
import { PaymentType } from "../models/payment";
import { SpaceType } from "../models/space";

export interface CreateAccountRequest {
    email: string;
    username: string;
    password: string;
    currency: string;
}

export interface VerifyOTPRequest {
    email: string;
    otpCode: string;
}

export interface FacebookLoginRequest {
    token: string;
    currency?: string;
}

export interface UpdateCurrencyRequest {
    email: string;
    currency: string;
}

export interface SavePaymentRequest {
    email: string;
    type: PaymentType;
    details: {
        cardType?: string;
        lastFourDigits?: string;
        expiryDate?: string;
        paypalEmail?: string;
    };
    isDefault: boolean;
}

export interface CreateSubscriptionRequest {
    email: string;
    planId: string;
    paymentId: string;
    autoRenew: boolean;
}

export interface CreateSpaceRequest {
    type: SpaceType;
    name: string;
    loanPrincipal?: mongoose.Schema.Types.Decimal128,
    creditCardLimit?: mongoose.Schema.Types.Decimal128
}

export interface MailOptions {
    to: string,
    subject: string,
    text: string
}

export interface MailRequest extends Document {
   userId: string;
   mailOptions: MailOptions,
   datetime: string,
   type: string,
}
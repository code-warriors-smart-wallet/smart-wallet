import axios from 'axios';
import { api } from '../config/api.config';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store/store';

export enum InterestType {
    FLAT = "FLAT",
    REDUCING = "REDUCING",
    EMI = "EMI",
    INTEREST_ONLY = "INTEREST_ONLY"
}

export enum PaymentFrequency {
    WEEKLY = 0.25,
    BI_WEEKLY = 0.5,
    MONTHLY = 1,
    BI_MONTHLY = 2,
    QUARTERLY = 3,
    SEMI_ANNUALLY = 6,
    ANNUALLY = 12
}

export enum InstallmentStatus {
    PENDING = "PENDING",
    PARTIAL_PAID = "PARTIAL_PAID",
    PAID = "PAID",
    OVERDUE = "OVERDUE"
}

export interface LoanRepaymentPlanInput {
    spaceId: string;
    loanAmount: number;
    startDate: string;
    endDate: string;
    interestRate: number;
    interestPeriod?: 'monthly' | 'yearly';
    interestType?: 'flat' | 'reducing' | 'emi' | 'interest-only';
    paymentFrequency: string;
    firstPaymentDate: string;
}

export function LoanRepaymentPlanService() {
    const token = useSelector((state: RootState) => state.auth.token);

    async function createPlan(body: LoanRepaymentPlanInput): Promise<any> {
        try {
            const response = await api.post(`finops/loan-repayment-plan`, body, {
                headers: {
                    "authorization": `Bearer ${token}`
                }
            });

            if (response.data.success) {
                toast.success(response.data.data.message || "Loan repayment plan created successfully!");
                return response.data.data.object;
            }
        } catch (error) {
            processError(error);
        }
    }

    async function updatePlan(planId: string, body: LoanRepaymentPlanInput): Promise<any> {
        try {
            const response = await api.put(`finops/loan-repayment-plan/${planId}`, body, {
                headers: {
                    "authorization": `Bearer ${token}`
                }
            });

            if (response.data.success) {
                toast.success(response.data.data.message || "Loan repayment plan updated successfully!");
                return response.data.data.object;
            }
        } catch (error) {
            processError(error);
        }
    }

    async function getPlanBySpaceId(spaceId: string): Promise<any> {
        try {
            const response = await api.get(`finops/loan-repayment-plan/space/${spaceId}`, {
                headers: {
                    "authorization": `Bearer ${token}`
                }
            });

            if (response.data.success) {
                return response.data.data.object;
            }
            return null;
        } catch (error) {
            console.error("Error getting loan repayment plan:", error);
            return null;
        }
    }

    async function getPlanWithSpaceDetails(planId: string): Promise<any> {
        try {
            const response = await api.get(`finops/loan-repayment-plan/${planId}/with-space`, {
                headers: {
                    "authorization": `Bearer ${token}`
                }
            });

            if (response.data.success) {
                return response.data.data.object;
            }
            return null;
        } catch (error) {
            console.error("Error getting plan with space details:", error);
            return null;
        }
    }


    async function getAllUserLoanPlans(): Promise<any[]> {
        try {
            const response = await api.get(`finops/loan-repayment-plan/user/all`, {
                headers: {
                    "authorization": `Bearer ${token}`
                }
            });

            if (response.data.success) {
                return response.data.data.object || [];
            }
            return [];
        } catch (error) {
            console.error("Error getting all user plans:", error);
            return [];
        }
    }

    async function getInstallmentsByPlanId(planId: string): Promise<any[]> {
        try {
            const response = await api.get(`finops/loan-repayment-plan/${planId}/installments`, {
                headers: {
                    "authorization": `Bearer ${token}`
                }
            });

            if (response.data.success) {
                return response.data.data.object;
            }
            return [];
        } catch (error) {
            console.error("Error getting installments:", error);
            return [];
        }
    }

    async function checkIfAnyPaymentMade(planId: string): Promise<boolean> {
        try {
            const installments = await getInstallmentsByPlanId(planId);
            return installments.some((inst: any) =>
                inst.principalPaid > 0 || inst.interestPaid > 0 || inst.penaltyPaid > 0
            );
        } catch (error) {
            console.error("Error checking payments:", error);
            return false;
        }
    }

    async function updateInstallment(
        installmentId: string,
        data: {
            principalPaid?: number;
            interestPaid?: number;
            penaltyPaid?: number;
            status?: string;
        }
    ): Promise<any> {
        try {
            const response = await api.put(`finops/loan-installment/${installmentId}`, data, {
                headers: {
                    "authorization": `Bearer ${token}`
                }
            });

            if (response.data.success) {
                return response.data.data.object;
            }
        } catch (error) {
            processError(error);
        }
    }

    async function updateInstallmentPenalty(installmentId: string, penaltyAmount: number): Promise<any> {
        try {
            const response = await api.put(`finops/loan-installment/${installmentId}/penalty`, { penaltyAmount }, {
                headers: {
                    "authorization": `Bearer ${token}`
                }
            });

            if (response.data.success) {
                return response.data.data.object;
            }
        } catch (error) {
            processError(error);
        }
    }

    async function deletePlan(planId: string): Promise<any> {
        try {
            const response = await api.delete(`finops/loan-repayment-plan/${planId}`, {
                headers: {
                    "authorization": `Bearer ${token}`
                }
            });

            if (response.data.success) {
                toast.success("Loan repayment plan deleted successfully!");
                return response.data.data;
            }
        } catch (error) {
            processError(error);
        }
    }

    async function checkIfPlanExists(spaceId: string): Promise<boolean> {
        try {
            const plan = await getPlanBySpaceId(spaceId);
            return !!plan;
        } catch (error) {
            return false;
        }
    }

    return {
        createPlan,
        updatePlan,
        getPlanBySpaceId,
        getPlanWithSpaceDetails,
        getAllUserLoanPlans,
        getInstallmentsByPlanId,
        checkIfAnyPaymentMade,
        updateInstallment,
        updateInstallmentPenalty,
        deletePlan,
        checkIfPlanExists
    };
}

function processError(error: unknown): void {
    if (axios.isAxiosError(error) && error.response) {
        const errorMessage = error.response.data?.error?.message || "An error occurred while processing your request.";
        toast.error(errorMessage);
    } else {
        toast.error("An unexpected error occurred. Please try again later.");
    }
    console.error("Error details:", error);
}
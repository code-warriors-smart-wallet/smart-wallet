import axios from 'axios';
import { api } from '../config/api.config';
import { toast } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux';
import { ScheduleInfo } from "../interfaces/modals";
import { RootState } from '@/redux/store/store';
import { getFail, getSuccess, getTransactionsSuccess } from '../redux/features/installments';

export function LoanRepaymentPlanService() {
    const token = useSelector((state: RootState) => state.auth.token)
    const dispatch = useDispatch();
    const pageLimit = 10;

    async function createRepaymentPlan(body: any): Promise<any> {
        try {
            console.log(body)
            const response = await api.post(`finops/installment/`, body, {
                headers: {
                    "authorization": `Bearer ${token}`
                }
            });
            if (response.data.success) {
                console.log(response.data.data)
                toast.success(response.data.data.message)
            }
        } catch (error) {
            processError(error)
        }
    }

    async function payInstallment(body: any): Promise<any> {
        try {
            console.log(body)
            const response = await api.post(`finops/installment/pay/${body.planId}`, body, {
                headers: {
                    "authorization": `Bearer ${token}`
                }
            });
            if (response.data.success) {
                console.log(response.data.data)
                toast.success(response.data.data.message)
            }
        } catch (error) {
            processError(error)
        }
    }

    async function deletePayment(body: any): Promise<any> {
        try {
            console.log(token)
            const response = await api.put(`finops/installment/transactions`, body, {
                headers: {
                    "authorization": `Bearer ${token}`
                }
            });
            if (response.data.success) {
                console.log(response.data.data)
                toast.success(response.data.data.message)
            }
        } catch (error) {
            processError(error)
        }
    }

    // async function deleteSchedule(id: string): Promise<any> {
    //     try {
    //         const response = await api.delete(`finops/schedule/${id}`, {
    //             headers: {
    //                 "authorization": `Bearer ${token}`
    //             }
    //         });
    //         if (response.data.success) {
    //             console.log(response.data)
    //             toast.success(response.data.message)
    //         }
    //     } catch (error) {
    //         processError(error)
    //     }
    // }

    async function getLoanInfo(spaceid: string): Promise<any> {
        try {
            const response = await api.get(`finops/installment/${spaceid}`, {
                headers: {
                    "authorization": `Bearer ${token}`
                }
            });
            console.log(response.data.data.object)
            if (response.data.success) {
                dispatch(getSuccess({
                    installments: response.data.data.object.installments,
                    loanInfo: response.data.data.object.loanInfo,
                    loanRepaymentPlanInfo: response.data.data.object.loanRepaymentPlanInfo
                }))
            }
            else {
                dispatch(getFail());
            }
        } catch (error) {
            processError(error)
            dispatch(getFail());
        }
    }

    async function getTransactions(planId: string, installmentNumber: string): Promise<any> {
        try {
            const response = await api.get(`finops/installment/transactions/${planId}/${installmentNumber}`, {
                headers: {
                    "authorization": `Bearer ${token}`
                }
            });
            console.log(response.data.data.object)
            if (response.data.success) {
                dispatch(getTransactionsSuccess(response.data.data.object))
            }
            else {
                dispatch(getFail());
            }
        } catch (error) {
            processError(error)
            dispatch(getFail());
        }
    }

    async function deletePlan(body: any): Promise<any> {
        try {
            const response = await api.put(`finops/installment/plan`, body, {
                headers: {
                    "authorization": `Bearer ${token}`
                }
            });
            console.log(response.data.data.object)
            if (response.data.success) {
                console.log(response.data.data)
                toast.success(response.data.data.message)
            }
        } catch (error) {
            processError(error)
            dispatch(getFail());
        }
    }

    return { getLoanInfo, pageLimit, createRepaymentPlan, payInstallment, getTransactions, deletePayment, deletePlan };
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

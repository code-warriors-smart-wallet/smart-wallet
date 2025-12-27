import axios from 'axios';
import { api } from '../config/api.config';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import {TransactionInfo} from "../interfaces/modals";
import { RootState } from '@/redux/store/store';

export function TransactionService() {
    const token = useSelector((state: RootState) => state.auth.token)

    async function createTransaction(body: TransactionInfo): Promise<any> {
        try {
            console.log(body)
            const response = await api.post(`finops/transaction/`, body, {
                headers: {
                    "authorization": `Bearer ${token}`
                }
            });
            if (response.data.success) {
                toast.success(response.data.data.message)
            }
        } catch (error) {
            processError(error)
        }
    }

    async function editTransaction(id: string, body: TransactionInfo): Promise<any> {
        try {
            console.log(body)
            const response = await api.put(`finops/transaction/${id}`, body, {
                headers: {
                    "authorization": `Bearer ${token}`
                }
            });
            if (response.data.success) {
                console.log(response.data)
                toast.success(response.data.data.message)
            }
        } catch (error) {
            processError(error)
        }
    }


    async function deleteTransaction(id: string): Promise<any> {
        try {
            const response = await api.delete(`finops/transaction/${id}`, {
                headers: {
                    "authorization": `Bearer ${token}`
                }
            });
            if (response.data.success) {
                console.log(response.data)
                toast.success(response.data.message)
            }
        } catch (error) {
            processError(error)
        }
    }

    async function getTransactionsByUser(spaceid: string, limit: number, skip: number): Promise<any> {
        try {
            const response = await api.get(`finops/transaction/user/${spaceid}/${limit}/${skip}`, {
                headers: {
                    "authorization": `Bearer ${token}`
                }
            });
            console.log(response.data.data.object)
            if (response.data.success) {
                return response.data.data.object
            }
            return []
        } catch (error) {
            processError(error)
            return []
        }
    }

    return { createTransaction, editTransaction, deleteTransaction, getTransactionsByUser };
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

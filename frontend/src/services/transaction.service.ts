import axios from 'axios';
import { api } from '../config/api.config';
import { toast } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux';
import { TransactionInfo } from "../interfaces/modals";
import { RootState } from '@/redux/store/store';
import { useState } from 'react';
import { getSuccess } from '../redux/features/transaction';

export function TransactionService() {
    const token = useSelector((state: RootState) => state.auth.token)
    const dispatch = useDispatch();
    const pageLimit = 10;

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
                dispatch(getSuccess({
                    total: response.data.data.object.total,
                    transactions: response.data.data.object.transactions
                }))
            }
            else {
                dispatch(getSuccess({
                    total: 0,
                    transactions: []
                }))
            }
        } catch (error) {
            processError(error)
            dispatch(getSuccess({
                total: 0,
                transactions: []
            }))
        } finally {
        }
    }

    async function searchTransactions(body: any): Promise<any> {
        try {
            const response = await api.post(`finops/transaction/search`, body, {
                headers: {
                    "authorization": `Bearer ${token}`
                }
            });
            console.log(response.data.data.object)
            if (response.data.success) {
                dispatch(getSuccess({
                    total: response.data.data.object.total,
                    transactions: response.data.data.object.transactions
                }))
            }
            else {
                dispatch(getSuccess({
                    total: 0,
                    transactions: []
                }))
            }
        } catch (error) {
            processError(error)
            dispatch(getSuccess({
                total: 0,
                transactions: []
            }))
        } finally {
        }
    }

    return { pageLimit, createTransaction, editTransaction, deleteTransaction, getTransactionsByUser, searchTransactions };
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

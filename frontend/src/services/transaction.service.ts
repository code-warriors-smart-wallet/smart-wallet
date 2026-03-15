// import axios from 'axios';
// import { api } from '../config/api.config';
// import { toast } from 'react-toastify';
// import { useSelector } from 'react-redux';
// import {TransactionInfo} from "../interfaces/modals";
// import { RootState } from '@/redux/store/store';

// export function TransactionService() {
//     const token = useSelector((state: RootState) => state.auth.token)

//     async function createTransaction(body: TransactionInfo): Promise<any> {
//         try {
//             console.log(body)
//             const response = await api.post(`finops/transaction/`, body, {
//                 headers: {
//                     "authorization": `Bearer ${token}`
//                 }
//             });
//             if (response.data.success) {
//                 toast.success(response.data.data.message)
//             }
//         } catch (error) {
//             processError(error)
//         }
//     }

//     async function editTransaction(id: string, body: TransactionInfo): Promise<any> {
//         try {
//             console.log(body)
//             const response = await api.put(`finops/transaction/${id}`, body, {
//                 headers: {
//                     "authorization": `Bearer ${token}`
//                 }
//             });
//             if (response.data.success) {
//                 console.log(response.data)
//                 toast.success(response.data.data.message)
//             }
//         } catch (error) {
//             processError(error)
//         }
//     }


//     async function deleteTransaction(id: string): Promise<any> {
//         try {
//             const response = await api.delete(`finops/transaction/${id}`, {
//                 headers: {
//                     "authorization": `Bearer ${token}`
//                 }
//             });
//             if (response.data.success) {
//                 console.log(response.data)
//                 toast.success(response.data.message)
//             }
//         } catch (error) {
//             processError(error)
//         }
//     }

//     async function getTransactionsByUser(spaceid: string, limit: number, skip: number): Promise<any> {
//         try {
//             const response = await api.get(`finops/transaction/user/${spaceid}/${limit}/${skip}`, {
//                 headers: {
//                     "authorization": `Bearer ${token}`
//                 }
//             });
//             console.log(response.data.data.object)
//             if (response.data.success) {
//                 return response.data.data.object
//             }
//             return []
//         } catch (error) {
//             processError(error)
//             return []
//         }
//     }

//     return { createTransaction, editTransaction, deleteTransaction, getTransactionsByUser };
// }

// function processError(error: unknown): void {
//     if (axios.isAxiosError(error) && error.response) {
//         const errorMessage = error.response.data?.error?.message || "An error occurred while processing your request.";
//         toast.error(errorMessage);
//     } else {
//         toast.error("An unexpected error occurred. Please try again later.");
//     }
//     console.error("Error details:", error);
// }

import axios from 'axios';
import { api } from '../config/api.config';
import { toast } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux';
import { TransactionInfo } from "../interfaces/modals";
import { RootState } from '@/redux/store/store';
import { useState } from 'react';
import { getSuccess } from '../redux/features/transaction';
 import { BudgetService } from './budget.service';

export function TransactionService() {
    const token = useSelector((state: RootState) => state.auth.token)
    const dispatch = useDispatch();
    const pageLimit = 10;

    // Helper function to validate and find matching budget entries for a transaction
    async function findMatchingBudgetEntries(transaction: TransactionInfo) {
        try {
            // Get all budgets for the space
            const budgets = await budgetService.getBudgetsBySpace(transaction.spaceId);
            
            const matchingEntries = [];
            
            for (const budget of budgets) {
                // Validate space ID is in budget's spaceIds array
                if (!budget.spaceIds || !budget.spaceIds.includes(transaction.spaceId)) {
                    continue;
                }
                
                // Validate category matches
                if (!transaction.pcategory || budget.mainCategoryId !== transaction.pcategory) {
                    continue;
                }
                
                // Validate subcategory if specified
                if (budget.subCategoryIds && budget.subCategoryIds.length > 0) {
                    const hasMatchingSubcategory = budget.subCategoryIds.some(
                        (subCatId: string) => subCatId === transaction.scategory
                    );
                    if (!hasMatchingSubcategory) {
                        continue;
                    }
                }
                
                // Get budget spending for the transaction date
                const budgetSpending = await budgetService.getBudgetSpending(
                    budget._id, 
                    transaction.date
                );
                
                if (budgetSpending && budgetSpending.currentEntry) {
                    // Check if transaction date falls within budget entry date range
                    const transactionDate = new Date(transaction.date);
                    const entryStartDate = new Date(budgetSpending.currentEntry.start_date);
                    const entryEndDate = new Date(budgetSpending.currentEntry.end_date);
                  
                    if (transactionDate >= entryStartDate && transactionDate <= entryEndDate) {
                        console.log(`Budget ${budget._id} has matching entry!`);
                        matchingEntries.push({
                            budget,
                            entry: budgetSpending.currentEntry
                        });
                    } else {
                        console.log(`Budget ${budget._id} skipped: Transaction date outside entry range`);
                    }
                } else {
                    console.log(`Budget ${budget._id} skipped: No current entry found`);
                }
            }
            
            console.log("Total matching entries found:", matchingEntries.length);
            return matchingEntries;
        } catch (error) {
            console.error("Error finding matching budget entries:", error);
            return [];
        }
    }

    // Helper function to find budget entries for the old transaction date
    async function findBudgetEntriesForDate(
        transaction: TransactionInfo, 
        targetDate: string
    ): Promise<any[]> {
        try {
            if (!targetDate) return [];
            
            // Create a copy of the transaction with the target date
            const tempTransaction = { ...transaction, date: targetDate };
            return await findMatchingBudgetEntries(tempTransaction);
        } catch (error) {
            console.error("Error finding budget entries for date:", error);
            return [];
        }
    }

    // function to properly convert MongoDB Decimal128 objects
    function convertAmountToNumber(amount: any): number {
       
        if (amount === null || amount === undefined) {
            return 0;
        }
        
        // Handle MongoDB Decimal128 object
        if (amount && typeof amount === "object") {
            // Check if it's a MongoDB Decimal128 object with $numberDecimal property
            if (amount.$numberDecimal !== undefined) {
                const value = parseFloat(amount.$numberDecimal);
                return value;
            }
            // Check if it has a toString method (Decimal128)
            else if ("toString" in amount && typeof amount.toString === "function") {
                const value = parseFloat(amount.toString());
                return value;
            }
            // Handle other object types
            else if (typeof amount === "object") {
                // Try to extract numeric value from common structures
                if (amount.value !== undefined) {
                    return convertAmountToNumber(amount.value);
                }
            }
        }
        
        if (typeof amount === "number") {
            return amount;
        } else if (typeof amount === "string") {
            const value = parseFloat(amount);
            return isNaN(value) ? 0 : value;
        }
        return 0;
    }

    async function updateBudgetSpentOnTransaction(
        transaction: TransactionInfo, 
        operation: 'create' | 'edit' | 'delete',
        oldTransaction?: TransactionInfo
    ): Promise<void> {
        try {
            if (operation === 'edit' && oldTransaction) {
                const oldDate = oldTransaction.date;
                const newDate = transaction.date;
                
                // Convert amounts to numbers
                const transactionAmount = convertAmountToNumber(transaction.amount);
                const oldAmount = convertAmountToNumber(oldTransaction.amount);
                
                // If date changed, we need to update both old and new budget entries
                if (oldDate !== newDate) {
                    console.log(`Transaction date changed from ${oldDate} to ${newDate}`);
                    
                    // 1. Remove from old budget entry (if exists)
                    if (oldDate) {
                        const oldBudgetEntries = await findBudgetEntriesForDate(
                            { ...oldTransaction, amount: -Math.abs(oldAmount) }, 
                            oldDate
                        );
                        
                        for (const { budget, entry } of oldBudgetEntries) {
                            try {
                                const transactionData = {
                                    transactionDate: oldDate,
                                    amount: -Math.abs(oldAmount),
                                    isEdit: false,
                                    oldAmount: 0,
                                    spaceId: transaction.spaceId
                                };
                                
                                const result = await budgetService.updateBudgetSpent(budget._id, transactionData);
                                console.log(`Removed old amount from budget ${budget._id}:`, result);
                            } catch (budgetError) {
                                console.error(`Error removing from old budget ${budget._id}:`, budgetError);
                            }
                        }
                    }
                    
                    // 2. Add to new budget entry (if exists)
                    const newBudgetEntries = await findBudgetEntriesForDate(
                        { ...transaction, amount: transactionAmount }, 
                        newDate
                    );
                    
                    for (const { budget, entry } of newBudgetEntries) {
                        try {
                            const transactionData = {
                                transactionDate: newDate,
                                amount: transactionAmount,
                                isEdit: false, 
                                oldAmount: 0,
                                spaceId: transaction.spaceId
                            };
                            
                            const result = await budgetService.updateBudgetSpent(budget._id, transactionData);
                            console.log(`Added new amount to budget ${budget._id}:`, result);
                        } catch (budgetError) {
                            console.error(`Error adding to new budget ${budget._id}:`, budgetError);
                        }
                    }
                    
                    return;
                }
            }

            const matchingEntries = await findMatchingBudgetEntries(transaction);

            if (matchingEntries.length === 0) {
                return;
            }
            
            for (const { budget, entry } of matchingEntries) {
                
                // Convert amounts to numbers
                const transactionAmount = convertAmountToNumber(transaction.amount);
                
                // Handle old amount - use 0 as default if oldTransaction is undefined
                let oldAmount = 0;
                if (operation === 'edit' && oldTransaction) {
                    const oldAmountValue = oldTransaction.amount ?? 0;
                    oldAmount = convertAmountToNumber(oldAmountValue);
                }
                                
                const transactionData = {
                    transactionDate: transaction.date,
                    amount: transactionAmount,
                    isEdit: operation === 'edit',
                    oldAmount: oldAmount,
                    spaceId: transaction.spaceId
                };
                                
                try {
                    // Update budget spent amount
                    const result = await budgetService.updateBudgetSpent(budget._id, transactionData);
                    console.log(`Updated budget ${budget._id}, entry ${entry.id}:`, result);
                } catch (budgetError) {
                    console.error(`Error updating budget ${budget._id}:`, budgetError);
                }
            }
        } catch (error) {
            console.error("Error updating budget spent:", error);
            throw error;
        }
    }

    async function createTransaction(body: TransactionInfo): Promise<any> {
        try {            
            // Validate transaction date format
            if (!body.date || isNaN(new Date(body.date).getTime())) {
                toast.error("Invalid transaction date");
                throw new Error("Invalid transaction date");
            }
            
            // Create the transaction
            const response = await api.post(`finops/transaction/`, body, {
                headers: {
                    "authorization": `Bearer ${token}`
                }
            });
            
            if (response.data.success) {
                const transaction = response.data.data.object;
                
                // Update budget spent amounts
                await updateBudgetSpentOnTransaction(body, 'create');
                
                toast.success(response.data.data.message || "Transaction created successfully!");
                return transaction;
            }
        } catch (error) {
            processError(error);
        }
    }

    async function editTransaction(id: string, body: TransactionInfo): Promise<any> {
        try {           
            // Validate transaction date format
            if (!body.date || isNaN(new Date(body.date).getTime())) {
                toast.error("Invalid transaction date");
                throw new Error("Invalid transaction date");
            }
            
            // Get the old transaction to know the previous amount
            let oldTransaction: TransactionInfo | undefined = undefined;
            try {
                const oldResponse = await api.get(`finops/transaction/${id}`, {
                    headers: {
                        "authorization": `Bearer ${token}`
                    }
                });
                if (oldResponse.data.success) {
                    const fetchedTransaction = oldResponse.data.data.object;
                    
                    // Convert and validate old amount
                    const convertedOldAmount = convertAmountToNumber(fetchedTransaction.amount);
                    
                    if (isNaN(convertedOldAmount)) {
                        toast.warning("Could not parse previous transaction amount. Using 0 as old amount.");
                        fetchedTransaction.amount = 0;
                    }
                    
                    oldTransaction = fetchedTransaction;
                }
            } catch (error) {
                console.error("Error fetching old transaction:", error);
                toast.warning("Could not fetch previous transaction data. Budget update may be incomplete.");
            }
            
            // Update the transaction
            const response = await api.put(`finops/transaction/${id}`, body, {
                headers: {
                    "authorization": `Bearer ${token}`
                }
            });
            
            if (response.data.success) {
                const updatedTransaction = response.data.data.object;
                
                // Update budget spent amounts with edit information
                // Pass oldTransaction if it exists, otherwise undefined
                await updateBudgetSpentOnTransaction(body, 'edit', oldTransaction);
                
                toast.success(response.data.data.message || "Transaction updated successfully!");
                return updatedTransaction;
            }
        } catch (error) {
            processError(error);
        }
    }

    async function deleteTransaction(id: string): Promise<any> {
        try {
            
            // First, get the transaction details before deleting
            let transaction: TransactionInfo | undefined = undefined;
            try {
                const getResponse = await api.get(`finops/transaction/${id}`, {
                    headers: {
                        "authorization": `Bearer ${token}`
                    }
                });
                if (getResponse.data.success) {
                    transaction = getResponse.data.data.object;
                    console.log("Transaction found for deletion:", transaction);
                    
                    // Convert amount to ensure it's a number
                    if (transaction) {
                        const currentAmount = transaction.amount ?? 0;
                        transaction.amount = convertAmountToNumber(currentAmount);
                    }
                }
            } catch (error) {
                console.error("Error fetching transaction for deletion:", error);
            }
            
            if (!transaction) {
                toast.error("Transaction not found");
                throw new Error("Transaction not found");
            }
            
            // Delete the transaction
            const response = await api.delete(`finops/transaction/${id}`, {
                headers: {
                    "authorization": `Bearer ${token}`
                }
            });
            
            if (response.data.success) {
                // For delete operation, amount should be negative to subtract from spent
                const transactionCopy = { ...transaction };
                const transactionAmount = transaction.amount ?? 0;
                transactionCopy.amount = -Math.abs(convertAmountToNumber(transactionAmount));
                
                await updateBudgetSpentOnTransaction(transactionCopy, 'delete');
                
                toast.success(response.data.message || "Transaction deleted successfully!");
                return response.data;
            }
        } catch (error) {
            processError(error);
        }
    }

    async function getTransactionsByUser(spaceid: string, limit: number, skip: number): Promise<any> {
        try {
            const response = await api.get(`finops/transaction/user/${spaceid}/${limit}/${skip}`, {
                headers: {
                    "authorization": `Bearer ${token}`
                }
            });
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
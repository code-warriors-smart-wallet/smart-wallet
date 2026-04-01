import React, { useEffect, useState } from 'react';
import { FaHandHoldingUsd, FaRegCheckCircle, FaRegClock, FaPercentage } from 'react-icons/fa';
import { GiMoneyStack, GiReceiveMoney, GiPayMoney } from "react-icons/gi";
import { MdOutlinePendingActions, MdOutlineCalendarToday } from "react-icons/md";
import { RiMoneyDollarCircleLine } from "react-icons/ri";
import { getFormattedDate } from '../../../../utils/utils';
import { Plan } from '@/interfaces/modals';

interface PlanSummaryProps {
    plans: any[];
    currency: string;
    onViewDetails: (spaceId: string, spaceType: string) => void;
}

function AllSpacesPlanSummary({ plans, currency, onViewDetails }: PlanSummaryProps) {
    const [processedPlans, setProcessedPlans] = useState<{
        lent: Plan[];
        borrowed: Plan[];
    }>({
        lent: [],
        borrowed: []
    });

    useEffect(() => {
        const lent = plans.filter(plan => plan.spaceId?.type === 'LOAN_LENT');
        const borrowed = plans.filter(plan => plan.spaceId?.type === 'LOAN_BORROWED');

        setProcessedPlans({
            lent,
            borrowed
        });
    }, [plans]);

    const calculateInstallmentStats = (plan: any) => {
        const totalInstallments = plan.installments?.length || 0;
        const completedInstallments = plan.installments?.filter((i: any) => i.status === 'PAID').length || 0;
        const partialInstallments = plan.installments?.filter((i: any) => i.status === 'PARTIAL_PAID').length || 0;
        const pendingInstallments = plan.installments?.filter((i: any) => i.status === 'PENDING').length || 0;

        return {
            totalInstallments,
            completedInstallments,
            partialInstallments,
            pendingInstallments
        };
    };

    const calculatePaymentTotals = (plan: any) => {
        const totalPrincipalPaid = plan.installments?.reduce((sum: number, i: any) => {
            const principal = i.principalPaid ? parseFloat(i.principalPaid.toString()) : 0;
            return sum + (isNaN(principal) ? 0 : principal);
        }, 0) || 0;

        const totalInterestPaid = plan.installments?.reduce((sum: number, i: any) => {
            const interest = i.interestPaid ? parseFloat(i.interestPaid.toString()) : 0;
            return sum + (isNaN(interest) ? 0 : interest);
        }, 0) || 0;

        return {
            totalPrincipalPaid,
            totalInterestPaid
        };
    };

    const getLoanAmount = (space: any): number => {
        if (!space?.loanPrincipal) {
            return 0;
        }

        try {
            let amount = 0;
            if (space.loanPrincipal.$numberDecimal) {
                amount = parseFloat(space.loanPrincipal.$numberDecimal);
            }
            else if (typeof space.loanPrincipal === 'number') {
                amount = space.loanPrincipal;
            }
            else if (typeof space.loanPrincipal === 'string') {
                amount = parseFloat(space.loanPrincipal);
            }
            else if (space.loanPrincipal.valueOf) {
                amount = parseFloat(space.loanPrincipal.valueOf());
            }
            else {
                amount = parseFloat(space.loanPrincipal.toString());
            }

            return isNaN(amount) ? 0 : amount;

        } catch (error) {
            console.error('Error parsing loan amount:', error);
            return 0;
        }
    };

    const getInterestRate = (space: any): string => {
        if (!space?.interestRate) return '0';

        try {
            let rate = 0;
            if (space.interestRate.$numberDecimal) {
                rate = parseFloat(space.interestRate.$numberDecimal);
            } else {
                rate = parseFloat(space.interestRate.toString());
            }
            return isNaN(rate) ? '0' : rate.toFixed(1);
        } catch {
            return '0';
        }
    };

    const formatAmount = (amount: number): string => {
        if (amount === undefined || amount === null || isNaN(amount)) {
            return '0.00';
        }
        return amount.toFixed(2);
    };

    const getProgressColor = (percentage: number) => {
        if (percentage >= 75) return 'bg-gradient-to-r from-green-400 to-emerald-500';
        if (percentage >= 50) return 'bg-gradient-to-r from-blue-400 to-indigo-500';
        if (percentage >= 25) return 'bg-gradient-to-r from-yellow-400 to-orange-500';
        return 'bg-gradient-to-r from-orange-400 to-red-500';
    };

    const renderPlanCard = (plan: any, isLent: boolean) => {
        const stats = calculateInstallmentStats(plan);
        const totals = calculatePaymentTotals(plan);
        const spaceType = plan.spaceId?.type === 'LOAN_LENT' ? 'loan-lent' : 'loan-borrowed';
        const loanAmount = getLoanAmount(plan.spaceId);
        const interestRate = getInterestRate(plan.spaceId);

        const safeLoanAmount = isNaN(loanAmount) ? 0 : Number(loanAmount);
        const safeTotalPrincipalPaid = isNaN(totals.totalPrincipalPaid) ? 0 : Number(totals.totalPrincipalPaid);
        const safeTotalInterestPaid = isNaN(totals.totalInterestPaid) ? 0 : Number(totals.totalInterestPaid);

        const remainingAmount = safeLoanAmount - safeTotalPrincipalPaid;
        const progressPercentage = safeLoanAmount > 0
            ? (safeTotalPrincipalPaid / safeLoanAmount) * 100
            : 0;

        const cardKey = `${plan._id}-${isLent ? 'lent' : 'borrowed'}`;

        return (
            <div
                key={cardKey}
                className="group relative overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer border border-gray-100 dark:border-gray-700"
                onClick={() => onViewDetails(plan.spaceId._id, spaceType)}
            >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-transparent to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                {/* Card Header with Icon and Title - Reduced padding */}
                <div className="relative p-3 pb-2">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                            <div className={`p-2 rounded-lg ${isLent
                                    ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
                                    : 'bg-gradient-to-br from-emerald-500 to-teal-600'
                                } shadow-md`}>
                                {isLent ? (
                                    <GiReceiveMoney className="text-white text-lg" />
                                ) : (
                                    <GiPayMoney className="text-white text-lg" />
                                )}
                            </div>
                            <div>
                                <h3 className="font-bold text-base text-gray-900 dark:text-white">
                                    {plan.spaceId?.name || 'Unnamed Loan'}
                                </h3>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${isLent
                                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                        }`}>
                                        {isLent ? 'Lending' : 'Borrowing'}
                                    </span>
                                    {interestRate !== '0' && (
                                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 flex items-center gap-0.5">
                                            <FaPercentage className="text-[8px]" />
                                            {interestRate}%
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Card Body - Reduced padding */}
                <div className="relative p-3 pt-1">
                    {/* Loan Amount - Reduced size */}
                    <div className="mb-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-600 dark:text-gray-400">Total Loan</span>
                            <span className="text-lg font-bold text-gray-900 dark:text-white">
                                {currency} {formatAmount(safeLoanAmount)}
                            </span>
                        </div>
                    </div>

                    {/* Stats Grid - Reduced size */}
                    <div className="grid grid-cols-2 gap-2 mb-2">
                        {isLent ? (
                            // LOAN LENT content
                            <>
                                <div className="p-1.5 rounded-lg bg-green-50 dark:bg-green-900/20">
                                    <div className="flex items-center gap-1 text-green-600 dark:text-green-400 mb-0.5">
                                        <FaRegCheckCircle className="text-[10px]" />
                                        <span className="text-[10px] font-medium">Principal Received</span>
                                    </div>
                                    <span className="text-xs font-bold text-green-700 dark:text-green-300">
                                        {currency} {formatAmount(safeTotalPrincipalPaid)}
                                    </span>
                                </div>
                                <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                                    <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 mb-0.5">
                                        <RiMoneyDollarCircleLine className="text-[10px]" />
                                        <span className="text-[10px] font-medium">Interest Received</span>
                                    </div>
                                    <span className="text-xs font-bold text-blue-700 dark:text-blue-300">
                                        {currency} {formatAmount(safeTotalInterestPaid)}
                                    </span>
                                </div>
                            </>
                        ) : (
                            // LOAN BORROWED content
                            <>
                                <div className="p-1.5 rounded-lg bg-green-50 dark:bg-green-900/20">
                                    <div className="flex items-center gap-1 text-green-600 dark:text-green-400 mb-0.5">
                                        <FaRegCheckCircle className="text-[10px]" />
                                        <span className="text-[10px] font-medium">Principal Paid</span>
                                    </div>
                                    <span className="text-xs font-bold text-green-700 dark:text-green-300">
                                        {currency} {formatAmount(safeTotalPrincipalPaid)}
                                    </span>
                                </div>
                                <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                                    <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 mb-0.5">
                                        <RiMoneyDollarCircleLine className="text-[10px]" />
                                        <span className="text-[10px] font-medium">Interest Paid</span>
                                    </div>
                                    <span className="text-xs font-bold text-blue-700 dark:text-blue-300">
                                        {currency} {formatAmount(safeTotalInterestPaid)}
                                    </span>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Progress Section - Reduced size */}
                    <div className="mb-2">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                Repayment Progress
                            </span>
                            <span className="text-xs font-bold text-gray-900 dark:text-white">
                                {progressPercentage.toFixed(1)}%
                            </span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${getProgressColor(progressPercentage)}`}
                                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Installment Info - Reduced size */}
                    {stats.totalInstallments > 0 && (
                        <div className="mb-2 p-2 rounded-lg border border-gray-100 dark:border-gray-700">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                    Installments
                                </span>
                                <span className="text-xs font-bold text-gray-900 dark:text-white">
                                    {stats.completedInstallments}/{stats.totalInstallments}
                                </span>
                            </div>

                            <div className="flex gap-2 text-[10px]">
                                <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                    <span>{stats.completedInstallments} Paid</span>
                                </div>
                                {stats.partialInstallments > 0 && (
                                    <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
                                        <span>{stats.partialInstallments} Partial</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                                    <span>{stats.pendingInstallments} Left</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Remaining Amount Highlight - Reduced size */}
                    <div className="flex justify-between items-center p-1.5 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800">
                        <span className="text-xs font-medium text-orange-700 dark:text-orange-300">
                            Remaining Principal
                        </span>
                        <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
                            {currency} {formatAmount(remainingAmount)}
                        </span>
                    </div>

                    {/* Footer with Dates - Reduced size */}
                    {(plan.spaceId?.loanStartDate || plan.spaceId?.loanEndDate) && (
                        <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700 flex justify-between text-[10px] text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                                <MdOutlineCalendarToday className="text-gray-400 text-[10px]" />
                                <span>Start: {plan.spaceId?.loanStartDate
                                    ? getFormattedDate(plan.spaceId.loanStartDate)
                                    : 'N/A'}
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                <MdOutlinePendingActions className="text-gray-400 text-[10px]" />
                                <span>End: {plan.spaceId?.loanEndDate
                                    ? getFormattedDate(plan.spaceId.loanEndDate)
                                    : 'N/A'}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Loan Lent Plans Section */}
            {processedPlans.lent.length > 0 && (
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md">
                            <FaHandHoldingUsd className="text-white text-lg" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                Money You've Lent
                            </h2>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                You have {processedPlans.lent.length} active lending plans
                            </p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {processedPlans.lent.map((plan) => renderPlanCard(plan, true))}
                    </div>
                </div>
            )}

            {/* Loan Borrowed Plans Section */}
            {processedPlans.borrowed.length > 0 && (
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md">
                            <GiMoneyStack className="text-white text-lg" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                Money You've Borrowed
                            </h2>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                You have {processedPlans.borrowed.length} active borrowing plans
                            </p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {processedPlans.borrowed.map((plan) => renderPlanCard(plan, false))}
                    </div>
                </div>
            )}

            {/* No plans message */}
            {processedPlans.lent.length === 0 && processedPlans.borrowed.length === 0 && (
                <div className="text-center py-12 px-4">
                    <div className="max-w-md mx-auto">
                        <div className="p-3 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                            <GiMoneyStack className="text-3xl text-gray-500 dark:text-gray-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            No Loan Plans Yet
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            Get started by creating a new loan space to track your lending or borrowing
                        </p>
                        <button className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 text-sm">
                            Create Your First Loan
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AllSpacesPlanSummary;
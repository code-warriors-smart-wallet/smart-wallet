import React, { useState, useEffect } from 'react';
import Button from '../../../Button';
import Input from '../../../Input';
import { LoanRepaymentPlanService } from '../../../../services/loanRepaymentPlan.sevice';
import { toast } from 'react-toastify';
import { IoWarning } from "react-icons/io5";

interface LoanRepaymentPlanFormProps {
    spaceId: string;
    spaceType: 'LOAN_LENT' | 'LOAN_BORROWED';
    defaultLoanAmount: number;
    defaultStartDate: string;
    defaultEndDate: string;
    onCancel: () => void;
    onSuccess: () => void;
    planId?: string;
    existingPlan?: any;
}

const paymentFrequencyOptions: { label: string; value: string; months: number; days: number }[] = [
    { label: 'Weekly', value: 'WEEKLY', months: 0.25, days: 7 },
    { label: 'Bi-Weekly', value: 'BI_WEEKLY', months: 0.5, days: 14 },
    { label: 'Monthly', value: 'MONTHLY', months: 1, days: 0 },
    { label: 'Bi-Monthly', value: 'BI_MONTHLY', months: 2, days: 0 },
    { label: 'Quarterly', value: 'QUARTERLY', months: 3, days: 0 },
    { label: 'Semi-Annually', value: 'SEMI_ANNUALLY', months: 6, days: 0 },
    { label: 'Annually', value: 'ANNUALLY', months: 12, days: 0 }
];

const interestTypeOptions: { label: string; value: 'flat' | 'reducing' | 'emi' | 'interest-only' }[] = [
    { label: 'Flat', value: 'flat' },
    { label: 'Reducing', value: 'reducing' },
    { label: 'EMI', value: 'emi' },
    { label: 'Interest Only', value: 'interest-only' }
];

function LoanRepaymentPlanForm({
    spaceId,
    spaceType,
    defaultLoanAmount,
    defaultStartDate,
    defaultEndDate,
    onCancel,
    onSuccess,
    planId,
    existingPlan
}: LoanRepaymentPlanFormProps) {

    const [loanAmount, setLoanAmount] = useState<number>(existingPlan?.loanAmount || defaultLoanAmount);
    const [startDate, setStartDate] = useState<string>(existingPlan?.startDate?.split('T')[0] || defaultStartDate);
    const [endDate, setEndDate] = useState<string>(existingPlan?.endDate?.split('T')[0] || defaultEndDate);
    const [interestRate, setInterestRate] = useState<number>(existingPlan?.interestRate || 0);
    const [interestPeriod, setInterestPeriod] = useState<'monthly' | 'yearly'>(existingPlan?.interestPeriod || 'monthly');
    const [interestType, setInterestType] = useState<'flat' | 'reducing' | 'emi' | 'interest-only'>(existingPlan?.interestType || 'flat');
    const [paymentFrequency, setPaymentFrequency] = useState<string>(existingPlan?.paymentFrequency || 'MONTHLY');
    const [firstPaymentDate, setFirstPaymentDate] = useState<string>(existingPlan?.firstPaymentDate?.split('T')[0] || '');
    const [loading, setLoading] = useState<boolean>(false);
    const [hasAnyPayment, setHasAnyPayment] = useState<boolean>(false);

    const { createPlan, updatePlan, checkIfAnyPaymentMade, deletePlan } = LoanRepaymentPlanService();

    // Check if any payment has been made for this plan
    useEffect(() => {
        if (planId) {
            checkIfAnyPaymentMade(planId).then(hasPayment => {
                setHasAnyPayment(hasPayment);
            });
        }
    }, [planId]);

    // Calculate first payment date based on start date and payment frequency
    useEffect(() => {
        if (startDate && paymentFrequency && !existingPlan) {
            const start = new Date(startDate);
            const freq = paymentFrequencyOptions.find(f => f.value === paymentFrequency);

            if (freq) {
                const firstDate = new Date(start);

                if (freq.days > 0) {
                    // For weekly and bi-weekly: add exact days
                    firstDate.setDate(firstDate.getDate() + freq.days);
                } else if (freq.months > 0) {
                    // For monthly, bi-monthly, quarterly, semi-annually, annually: add exact months
                    firstDate.setMonth(firstDate.getMonth() + freq.months);
                }

                // Format as YYYY-MM-DD for input field
                const year = firstDate.getFullYear();
                const month = String(firstDate.getMonth() + 1).padStart(2, '0');
                const day = String(firstDate.getDate()).padStart(2, '0');

                setFirstPaymentDate(`${year}-${month}-${day}`);
            }
        }
    }, [startDate, paymentFrequency, existingPlan]);

    // If EMI selected, force monthly payment frequency
    useEffect(() => {
        if (interestType === 'emi') {
            setPaymentFrequency('MONTHLY');
        }
    }, [interestType]);

    const handleSubmit = async () => {
        // Validation
        if (!loanAmount || loanAmount <= 0) {
            toast.error("Please enter a valid loan amount");
            return;
        }

        if (!startDate) {
            toast.error("Please select start date");
            return;
        }

        if (!endDate) {
            toast.error("Please select end date");
            return;
        }

        if (new Date(endDate) <= new Date(startDate)) {
            toast.error("End date must be after start date");
            return;
        }

        if (!firstPaymentDate) {
            toast.error("Please select first payment date");
            return;
        }

        setLoading(true);

        try {
            if (planId) {
                // Edit mode - update existing plan
                if (hasAnyPayment) {
                    toast.error("Cannot edit plan after first payment. Please delete and create a new plan.");
                    return;
                }

                await updatePlan(planId, {
                    spaceId,
                    loanAmount,
                    startDate,
                    endDate,
                    interestRate,
                    interestPeriod: interestRate !== 0 ? interestPeriod : undefined,
                    interestType: interestRate !== 0 ? interestType : undefined,
                    paymentFrequency,
                    firstPaymentDate
                });
            } else {
                // Create mode
                await createPlan({
                    spaceId,
                    loanAmount,
                    startDate,
                    endDate,
                    interestRate,
                    interestPeriod: interestRate !== 0 ? interestPeriod : undefined,
                    interestType: interestRate !== 0 ? interestType : undefined,
                    paymentFrequency,
                    firstPaymentDate
                });
            }
            onSuccess();
        } catch (error) {
            console.error("Error creating plan:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!planId) return;

        if (confirm("Are you sure you want to delete this repayment plan? All associated installments and transactions will be permanently deleted. This action cannot be undone.")) {
            setLoading(true);
            try {
                await deletePlan(planId);
                onSuccess();
            } catch (error) {
                console.error("Error deleting plan:", error);
            } finally {
                setLoading(false);
            }
        }
    };

    const getDisabledInputClass = (isDisabled: boolean) => {
        return isDisabled ? 'cursor-not-allowed opacity-60' : '';
    };


    return (
        <div className="fixed top-0 left-0 w-screen h-screen z-[999] grid place-items-center bg-opacity-50 overflow-auto p-4 modal-bg pt-10">
            <div className="relative w-full max-w-lg rounded-lg bg-bg-light-secondary dark:bg-bg-dark-secondary shadow-sm p-3">
                <div className="flex shrink-0 items-center pb-4 text-xl font-medium text-text-light-primary dark:text-text-dark-primary">
                    {planId ? 'Edit Loan Repayment Plan' : 'Create Loan Repayment Plan'}
                </div>

                {hasAnyPayment && planId && (
                    <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
                        <p className="text-sm flex items-center gap-1">
                            <IoWarning /> This plan already has payments. Editing is disabled. You can only delete it.
                        </p>
                    </div>
                )}

                <div className="border-t border-b border-border-light-primary dark:border-border-dark-primary py-3">
                    {/* Loan Amount */}
                    <div className="my-3">
                        <label className="text-text-light-primary dark:text-text-dark-primary font-bold">
                            Loan Amount: <span className="text-red-500">*</span>
                        </label>
                        <Input
                            name="loanAmount"
                            type="number"
                            value={loanAmount.toString()}
                            onChange={(e) => setLoanAmount(parseFloat(e.target.value))}
                            className={`mt-1 mb-1 ${getDisabledInputClass(hasAnyPayment)}`}
                            placeholder="Enter loan amount"
                            disabled={hasAnyPayment}
                        />
                        <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                            Default: {defaultLoanAmount}
                        </p>
                    </div>

                    {/* Start Date */}
                    <div className="my-3">
                        <label className="text-text-light-primary dark:text-text-dark-primary font-bold">
                            Start Date: <span className="text-red-500">*</span>
                        </label>
                        <Input
                            name="startDate"
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className={`mt-1 mb-1 ${getDisabledInputClass(hasAnyPayment)}`}
                            placeholder="Select start date"
                            disabled={hasAnyPayment}
                        />
                    </div>

                    {/* End Date */}
                    <div className="my-3">
                        <label className="text-text-light-primary dark:text-text-dark-primary font-bold">
                            End Date: <span className="text-red-500">*</span>
                        </label>
                        <Input
                            name="endDate"
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className={`mt-1 mb-1 ${getDisabledInputClass(hasAnyPayment)}`}
                            placeholder="Select end date"
                            min={startDate}
                            disabled={hasAnyPayment}
                        />
                    </div>

                    {/* Interest Rate */}
                    <div className="my-3">
                        <label className="text-text-light-primary dark:text-text-dark-primary font-bold">
                            Interest Rate (%):
                        </label>
                        <input
                            type="number"
                            name="interestRate"
                            value={interestRate.toString()}
                            onChange={(e) => setInterestRate(parseFloat(e.target.value))}
                            step="0.01"
                            placeholder="Enter interest rate (0 for no interest)"
                            className={`bg-bg-light-primary dark:bg-bg-dark-primary w-full p-3 my-3 rounded border-2 border-border-light-primary dark:border-border-dark-primary text-text-light-primary dark:text-text-dark-primary outline-none focus:border-primary focus:bg-transparent text-sm ${getDisabledInputClass(hasAnyPayment)}`}
                            disabled={hasAnyPayment}
                        />
                    </div>

                    {/* Interest Period (shown only if interest rate != 0) */}
                    {interestRate !== 0 && (
                        <div className="my-3">
                            <label className="text-text-light-primary dark:text-text-dark-primary font-bold">
                                Interest Period:
                            </label>
                            <select
                                className={`w-full p-3 my-3 border border-border-light-primary dark:border-border-dark-primary rounded-md bg-bg-light-primary dark:bg-bg-dark-primary text-text-light-primary dark:text-text-dark-primary focus:border-primary text-sm ${getDisabledInputClass(hasAnyPayment)}`}
                                value={interestPeriod}
                                onChange={(e) => setInterestPeriod(e.target.value as 'monthly' | 'yearly')}
                                disabled={hasAnyPayment}
                            >
                                <option value="monthly">Monthly</option>
                                <option value="yearly">Yearly</option>
                            </select>
                        </div>
                    )}

                    {/* Interest Type (shown only if interest rate != 0) */}
                    {interestRate !== 0 && (
                        <div className="my-3">
                            <label className="text-text-light-primary dark:text-text-dark-primary font-bold">
                                Interest Type:
                            </label>
                            <select
                                className={`w-full p-3 my-3 border border-border-light-primary dark:border-border-dark-primary rounded-md bg-bg-light-primary dark:bg-bg-dark-primary text-text-light-primary dark:text-text-dark-primary focus:border-primary text-sm ${getDisabledInputClass(hasAnyPayment)}`}
                                value={interestType}
                                onChange={(e) => setInterestType(e.target.value as 'flat' | 'reducing' | 'emi' | 'interest-only')}
                                disabled={hasAnyPayment}
                            >
                                {interestTypeOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Payment Frequency */}
                    <div className="my-3">
                        <label className="text-text-light-primary dark:text-text-dark-primary font-bold">
                            Payment Frequency: <span className="text-red-500">*</span>
                        </label>
                        <select
                            className={`w-full p-3 my-3 border border-border-light-primary dark:border-border-dark-primary rounded-md bg-bg-light-primary dark:bg-bg-dark-primary text-text-light-primary dark:text-text-dark-primary focus:border-primary text-sm ${getDisabledInputClass(interestType === 'emi' || hasAnyPayment)}`}
                            value={paymentFrequency}
                            onChange={(e) => setPaymentFrequency(e.target.value)}
                            disabled={interestType === 'emi' || hasAnyPayment}
                        >
                            {paymentFrequencyOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        {interestType === 'emi' && (
                            <p className="text-xs text-yellow-500">EMI requires monthly payments</p>
                        )}
                    </div>

                    {/* First Payment Date */}
                    <div className="my-3">
                        <label className="text-text-light-primary dark:text-text-dark-primary font-bold">
                            First Payment Date: <span className="text-red-500">*</span>
                        </label>
                        <Input
                            name="firstPaymentDate"
                            type="date"
                            value={firstPaymentDate}
                            onChange={(e) => setFirstPaymentDate(e.target.value)}
                            className={`mt-1 mb-1 ${getDisabledInputClass(hasAnyPayment)}`}
                            placeholder="Select first payment date"
                            min={startDate}
                            disabled={hasAnyPayment}
                        />
                    </div>
                </div>

                <div className="flex shrink-0 flex-wrap items-center pt-4 justify-end">
                    <Button
                        text="Cancel"
                        className="max-w-fit"
                        priority="secondary"
                        onClick={onCancel}
                    />
                    {planId && (
                        <Button
                            text={loading ? "Deleting..." : "Delete Plan"}
                            className="max-w-fit ml-3 bg-red-500 hover:bg-red-600"
                            onClick={handleDelete}
                            disabled={loading}
                        />
                    )}

                    {(!planId || !hasAnyPayment) && (
                        <Button
                            text={loading ? "Saving..." : (planId ? "Update Plan" : "Create Plan")}
                            className="max-w-fit ml-3"
                            onClick={handleSubmit}
                            disabled={loading || !!(planId && hasAnyPayment)}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

export default LoanRepaymentPlanForm;
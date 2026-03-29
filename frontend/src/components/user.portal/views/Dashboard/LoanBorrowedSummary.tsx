import { FaHandHoldingUsd } from "react-icons/fa";
import { capitalize, getFormattedDate } from "../../../../utils/utils";
import { Installment, InstallmentStatus } from "../LoanRepaymentPlan";

function LoanBorrowedSummary({ currency, loanSummary }: { currency: string, loanSummary: any }) {
    const loanAmount = loanSummary?.loan ? loanSummary.loan[0].loanPrincipal.$numberDecimal : 0;
    const startDate = loanSummary?.loan ? (loanSummary.loan[0]?.loanStartDate?.split("T")[0] || "Not set") : "Not set";
    const endDate = loanSummary?.loan ? (loanSummary.loan[0]?.loanEndDate?.split("T")[0] || "Not set") : "Not set";
    const interest = loanSummary?.interestPaid?.length > 0 ? Number(loanSummary.interestPaid[0].amount).toFixed(2) : 0;
    const principalPaid = loanSummary?.principalPaid?.length > 0 ? Number(loanSummary.principalPaid[0].amount).toFixed(2) : 0;
    const penaltyPaid = loanSummary?.penaltyPaid?.length > 0 ? Number(loanSummary.penaltyPaid[0].amount).toFixed(2) : 0;
    const principalRate = loanAmount > 0 ? (Number(principalPaid) / loanAmount * 100).toFixed(0) : 0;
    const plan = loanSummary?.loanRepaymentPlan ? loanSummary.loanRepaymentPlan[0] : null;
    const interestRate = plan ? (Number(interest) / plan.totalInterest * 100).toFixed(0) : 0;
    const totalInterest = plan ? Number(plan.totalInterest).toFixed(2) : 0;
    const installments = loanSummary?.installments || [];
    const settledInstallments = installments.filter((i: Installment) => i.status === InstallmentStatus.PAID);
    const overdueInstallments = installments.filter((i: Installment) => new Date(i.endDate) < new Date() && i.status !== InstallmentStatus.PAID);
    const overDueAmount = overdueInstallments.reduce((acc: number, i: Installment) => acc + i.principalAmount + i.interestAmount - (i.principalPaid || 0) - (i.interestPaid || 0), 0);
    const totalPaid = (Number(principalPaid) + Number(interest) + Number(penaltyPaid)).toFixed(2);


    return (
        <section className="rounded my-3 p-3 border border-border-light-primary dark:border-border-dark-primary *:text-text-light-primary *:dark:text-text-dark-primary">
            {/* title */}
            <div className="rounded flex justify-between items-center ">
                <span className="flex gap-3 items-center text-xl font-bold"><FaHandHoldingUsd />Loan summary</span>
            </div>

            {/* cash flow */}
            <div className="flex gap-3 *:flex-1 flex-wrap">

                <div className="pb-2 border-border-light-primary dark:border-border-dark-primary mt-3">
                    <h1 className="font-semibold">Loan amount</h1>
                    <h2 className="text-xl font-semibold text-text-light-secondary dark:text-text-dark-secondary">{loanAmount} {currency}</h2>
                </div>
                <div className="pb-2 border-border-light-primary dark:border-border-dark-primary mt-3">
                    <h1 className="font-semibold">Total Interest</h1>
                    <h2 className="text-xl font-semibold text-text-light-secondary dark:text-text-dark-secondary">{plan ? `${totalInterest} ${currency}` : "N/A"}</h2>
                </div>
                <div className="pb-2 border-border-light-primary dark:border-border-dark-primary mt-3">
                    <h1 className="font-semibold">Interest rate</h1>
                    <h2 className="text-xl font-semibold text-text-light-secondary dark:text-text-dark-secondary">{plan ? `${plan.monthlyInterestRate}% p.m.` : "N/A"}</h2>
                </div>
                <div className="pb-2 border-border-light-primary dark:border-border-dark-primary mt-3">
                    <h1 className="font-semibold">Interest type</h1>
                    <h2 className="text-xl font-semibold text-text-light-secondary dark:text-text-dark-secondary capitalize">{capitalize(plan?.interestType?.toString()?.split("_")?.join(" ")) || "N/A"}</h2>
                </div>
                <div className="pb-2 border-border-light-primary dark:border-border-dark-primary mt-3">
                    <h1 className="font-semibold">Start date</h1>
                    <h2 className="text-xl font-semibold text-text-light-secondary dark:text-text-dark-secondary">{getFormattedDate(installments[0]?.startDate) || "N/A"}</h2>
                </div>

            </div>
            <div className="flex gap-3 *:flex-1 flex-wrap">
                <div className="pb-2 border-border-light-primary dark:border-border-dark-primary mt-3">
                    <h1 className="font-semibold">End date</h1>
                    <h2 className="text-xl font-semibold text-text-light-secondary dark:text-text-dark-secondary">{getFormattedDate(installments[installments.length - 1]?.endDate) || "N/A"}</h2>
                </div>
                <div className="pb-2 border-border-light-primary dark:border-border-dark-primary mt-3">
                    <h1 className="font-semibold">Principal paid</h1>
                    <h2 className="text-xl font-semibold text-text-light-secondary dark:text-text-dark-secondary">{principalPaid} {currency}</h2>
                </div>
                <div className="pb-2 border-border-light-primary dark:border-border-dark-primary mt-3">
                    <h1 className="font-semibold">Interest paid</h1>
                    <h2 className="text-xl font-semibold text-text-light-secondary dark:text-text-dark-secondary">{interest} {currency}</h2>
                </div>
                <div className="pb-2 border-border-light-primary dark:border-border-dark-primary mt-3">
                    <h1 className="font-semibold">Penalty paid</h1>
                    <h2 className="text-xl font-semibold text-text-light-secondary dark:text-text-dark-secondary">{penaltyPaid} {currency}</h2>
                </div>
                <div className="pb-2 border-border-light-primary dark:border-border-dark-primary mt-3">
                    <h1 className="font-semibold">Total paid</h1>
                    <h2 className="text-xl font-semibold text-text-light-secondary dark:text-text-dark-secondary">{totalPaid} {currency}</h2>
                </div>
            </div>
            <div className="flex gap-3 *:flex-1 flex-wrap">
                <div className="pb-2 border-border-light-primary dark:border-border-dark-primary mt-3">
                    <h1 className="font-semibold">No of Installments</h1>
                    <h2 className="text-xl font-semibold text-text-light-secondary dark:text-text-dark-secondary">{installments.length}</h2>
                </div>
                <div className="pb-2 border-border-light-primary dark:border-border-dark-primary mt-3">
                    <h1 className="font-semibold">Settled installments</h1>
                    <h2 className="text-xl font-semibold text-text-light-secondary dark:text-text-dark-secondary">

                        {
                            plan
                                ? settledInstallments.length : "N/A"
                        }
                    </h2>
                </div>
                <div className="pb-2 border-border-light-primary dark:border-border-dark-primary mt-3">
                    <h1 className="font-semibold">Overdue Installments</h1>
                    <h2 className="text-xl font-semibold text-text-light-secondary dark:text-text-dark-secondary">
                        {
                            plan ?
                                overdueInstallments.length : "N/A"
                        }
                    </h2>
                </div>
                <div className="pb-2 border-border-light-primary dark:border-border-dark-primary mt-3">
                    <h1 className="font-semibold">Overdue amount</h1>
                    <h2 className="text-xl font-semibold text-text-light-secondary dark:text-text-dark-secondary">
                        {
                            plan ?
                                Number(overDueAmount).toFixed(2) + ` ${currency}`
                                : "N/A"
                        }
                    </h2>
                </div>
                <div className="pb-2 border-border-light-primary dark:border-border-dark-primary mt-3">
                    <h1 className="font-semibold">Next due date</h1>
                    <h2 className="text-xl font-semibold text-text-light-secondary dark:text-text-dark-secondary">
                        {
                            getFormattedDate(
                                installments
                                    .filter((i: Installment) => new Date(i.endDate) > new Date())
                                    .sort((a: Installment, b: Installment) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())[0]?.endDate.split("T")[0]
                            ) || "N/A"
                        }
                    </h2>
                </div>
            </div>

            {/* due charts */}
            <div className="flex gap-3 *:flex-1 flex-wrap">
                <div className="p-2 border border-border-light-primary dark:border-border-dark-primary mt-3">
                    <h1>Principal Due</h1>
                    <div className="mt-3">
                        <div className="text-right w-full text-xs text-text-light-secondary dark:text-text-dark-secondary">{principalPaid} {currency}/{loanAmount} {currency}</div>
                        <div className="mt-2 w-full bg-gray-200 rounded-full dark:bg-gray-700">
                            <div className="bg-primary text-xs font-medium text-blue-100 text-center p-0.5 leading-none rounded-full" style={{ width: `${Number(principalRate) > 100 ? 100 : principalRate}%` }}> {principalRate}%</div>
                        </div>
                    </div>
                </div>
            </div>
            {
                plan && (
                    <div className="flex gap-3 *:flex-1 flex-wrap">

                        <div className="p-2 border border-border-light-primary dark:border-border-dark-primary mt-3">
                            <h1>Interest Due</h1>
                            <div className="mt-3">
                                <div className="text-right w-full text-xs text-text-light-secondary dark:text-text-dark-secondary">{interest} {currency}/{totalInterest} {currency}</div>
                                <div className="mt-2 w-full bg-gray-200 rounded-full dark:bg-gray-700">
                                    <div className="bg-primary text-xs font-medium text-blue-100 text-center p-0.5 leading-none rounded-full" style={{ width: `${Number(interestRate) > 100 ? 100 : interestRate}%` }}> {interestRate}%</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

        </section >
    )
}

export default LoanBorrowedSummary;
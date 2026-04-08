import { FaBalanceScale } from "react-icons/fa";

function NetWorthSummary({ summary, currency }: { summary: any, currency: string }) {
    const assets = (summary?.totalCashAssetAmount ?? 0) + (summary?.totalBankAssetAmount ?? 0) + (summary?.totalLoanLentAssetAmount ?? 0)
    const liabilties = (summary?.totalLoanBorrowedLiabilityAmount ?? 0) + (summary?.totalCreditcardLiabilityAmount ?? 0)
    return (
        <div className="app-card flex justify-between items-center *:text-xl *:text-text-light-primary *:dark:text-text-dark-primary *:font-bold bg-secondary">
            <span className="flex gap-3 items-center"><FaBalanceScale /><span>Net worth (Assets - Liabilities):</span></span>
            <span>{assets-liabilties} {currency}</span>
        </div>
    )
}

export default NetWorthSummary;
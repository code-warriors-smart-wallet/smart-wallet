import { FaCoins } from "react-icons/fa";

function CurrentBalance({ balance, currency }: { balance: number, currency: string }) {
    return (
        <div className="rounded my-3 p-3 flex justify-between items-center border border-border-light-primary dark:border-border-dark-primary *:text-xl *:text-text-light-primary *:dark:text-text-dark-primary *:font-bold bg-secondary">
            <span className="flex gap-3 items-center"><FaCoins /><span> Current Balance</span></span>
            <span>{balance.toFixed(2)} {currency}</span>
        </div>
    )
}

export default CurrentBalance;
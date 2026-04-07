import { FaCheckCircle } from "react-icons/fa";
import Button from "../../../../components/Button";
import { PlanInfo, PlanType } from "../../../../interfaces/modals";
import { AuthService } from "../../../../services/auth/auth.service";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Loading from "../../../../components/Loading";
import { useSelector } from "react-redux";
import { RootState } from "../../../../redux/store/store";

function Upgrade({setUpgradeMode, message}: {setUpgradeMode: React.Dispatch<React.SetStateAction<string>>, message: string}) {

    const [plans, setPlans] = useState<PlanInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const { getAllPlans, subscribePlan } = AuthService();
    const { email, plan } = useSelector((state: RootState) => state.auth);
    const location = useLocation();

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const plansData = await getAllPlans();
                console.log(plansData);
                setPlans(plansData);
            } finally {
                setLoading(false);
            }
        };

        fetchPlans();
    }, []);

    async function handleUpgrade(planItem: PlanInfo): Promise<void> {
        if (!email) return;
        if (!planItem._id) {
            console.error(">>>> Upgrade failed: Plan ID is missing!", planItem);
            return;
        }
        console.log(">>>> Upgrading to:", planItem.name, "with ID:", planItem._id);
        await subscribePlan({ autoRenew: false, email: email, planId: planItem._id, paymentId: null }, planItem.name);
        setUpgradeMode(""); // Close modal after successful action start/completion
    }

    if (loading) {
        return (
            <Loading/>
        )


    }

    return (
        <div
            className="fixed top-0 left-0 w-screen h-screen z-[999] grid place-items-center bg-opacity-50 overflow-auto p-4 modal-bg pt-10"
        >
            <div
                className="relative rounded-xl bg-bg-light-secondary dark:bg-bg-dark-secondary shadow-2xl p-8 max-w-4xl w-full border border-border-light-primary dark:border-border-dark-primary"
            >
                <div className="flex shrink-0 items-center justify-center pb-8 text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">
                    <h1 className="">{message}</h1>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
                    {plans.map((planItem) => (
                        <div key={planItem.name}
                            className={`border ${planItem.name === PlanType.PLUS ? "border-primary ring-1 ring-primary shadow-primary/20" : "border-border-light-primary dark:border-border-dark-primary"} 
                                        rounded-xl p-8 shadow-xl transition-all duration-300 
                                        flex flex-col bg-bg-light-primary dark:bg-bg-dark-primary`}>
                            <div className="flex-grow">
                                <h2 className="text-3xl font-bold mb-2 text-text-light-primary dark:text-text-dark-primary">
                                    {planItem.name}
                                </h2>
                                <p className="text-text-light-secondary dark:text-text-dark-secondary mb-6 text-sm opacity-80">
                                    {planItem.description}
                                </p>
                                <div className="mb-8">
                                    <span className="text-4xl font-bold text-text-light-primary dark:text-text-dark-primary">
                                        {planItem.currency} {planItem.monthly_price}
                                    </span>
                                    <span className="text-text-light-secondary dark:text-text-dark-secondary ml-2 text-lg">
                                        /month
                                    </span>
                                </div>
                                <ul className="space-y-4 mb-10">
                                    {planItem.features.map((feature, index) => (
                                        <li key={index}
                                            className="flex items-start gap-3 text-sm text-text-light-secondary dark:text-text-dark-secondary leading-tight">
                                            <FaCheckCircle className="text-green-500 mt-0.5 shrink-0" size={18} />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="mt-auto pt-4">
                                {
                                    (plan || PlanType.STARTER) === planItem.name ? (
                                        <Button
                                            text="Current plan"
                                            className="w-full !bg-transparent border border-border-light-primary dark:border-border-dark-primary text-text-light-primary dark:text-text-dark-primary cursor-default"
                                            onClick={() => { }}
                                        />
                                    ) : (
                                        <div className="flex flex-col gap-3">
                                            <Button
                                                text={(plan === PlanType.PLUS && planItem.name === PlanType.STARTER) ? "Switch to Starter" : "Upgrade"}
                                                className="w-full py-3 text-lg font-semibold cursor-pointer shadow-lg shadow-primary/25"
                                                onClick={() => handleUpgrade(planItem)}
                                            />
                                            <Button
                                                text="Not now"
                                                className="w-full !bg-transparent border border-border-light-primary dark:border-border-dark-primary text-text-light-primary dark:text-text-dark-primary py-2 text-sm opacity-80 hover:opacity-100"
                                                onClick={() => setUpgradeMode("")}
                                            />
                                        </div>
                                    )
                                }
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )

}

export default Upgrade;

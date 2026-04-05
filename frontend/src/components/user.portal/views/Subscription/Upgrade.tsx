import { FaCheckCircle } from "react-icons/fa";
import Button from "../../../../components/Button";
import { PlanInfo, PlanType } from "../../../../interfaces/modals";
import { AuthService } from "../../../../services/auth/auth.service";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Loading from "../../../../components/Loading";

function Upgrade({setUpgradeMode, message}: {setUpgradeMode: React.Dispatch<React.SetStateAction<string>>, message: string}) {

    const [plans, setPlans] = useState<PlanInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const { getAllPlans, subscribePlan } = AuthService();
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

    async function handleUpgrade(): Promise<void> {
        // await subscribePlan({ autoRenew: false, email: email, planId: plan._id }, plan.name);
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
                className="relative rounded-lg bg-bg-light-secondary dark:bg-bg-dark-secondary shadow-sm p-3"
            >
                <div className="flex shrink-0 items-center justify-center pb-4 text-xl font-medium text-text-light-primary dark:text-text-dark-primary">
                    <h1 className="font-bold text-2xl">{message}</h1>
                </div>
                <div className="flex gap-4 items-stretch justify-center">
                    {plans.map((plan) => (
                        <div key={plan.name}
                            className={`border w-md flex-wrap ${plan.name === PlanType.PLUS ? "border-primary shodow shadow-lg" : "border-border-light-primary dark:border-border-dark-primary"} 
                                        rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 
                                        flex flex-col bg-bg-light-primary dark:bg-bg-dark-primary`}>
                            <div className="flex-grow">
                                <h2 className="text-2xl font-semibold mb-4 text-text-light-primary dark:text-text-dark-primary">
                                    {plan.name}
                                </h2>
                                <p className="text-text-light-secondary dark:text-text-dark-secondary mb-4 font-bold">
                                    {plan.description}
                                </p>
                                <div className="mb-6">
                                    <span className="text-4xl font-bold text-text-light-primary dark:text-text-dark-primary">
                                        {plan.currency} {plan.monthly_price}
                                    </span>
                                    <span className="text-text-light-secondary dark:text-text-dark-secondary ml-2">
                                        /month
                                    </span>
                                </div>
                                {/* <div className="mb-6">
                                    <span className="text-4xl font-bold text-text-light-primary dark:text-text-dark-primary">
                                        {plan.currency} {plan.yearly_price}
                                    </span>
                                    <span className="text-text-light-secondary dark:text-text-dark-secondary ml-2">
                                        /year
                                    </span>
                                </div> */}
                                <ul className="space-y-3 mb-8">
                                    {plan.features.map((feature, index) => (
                                        <li key={index}
                                            className="flex items-center gap-2 text-text-light-secondary dark:text-text-dark-secondary">
                                            <FaCheckCircle className="text-green-400" size={16} />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            {
                                plan.name === PlanType.STARTER ? (
                                    <Button
                                        text="Current plan"
                                        className="!bg-transparent border border-primary"
                                        onClick={() => { }}
                                    />
                                ) : (
                                    <div className="">
                                        <Button
                                            text="Upgrade"
                                            className="cursor-pointer"
                                            onClick={() => handleUpgrade()}
                                        />
                                        <Button
                                            text="Not now"
                                            className="cursor-pointer !bg-transparent mt-2 border border-border-light-primary dark:border-border-dark-primary text-text-light-primary dark:text-text-dark-primary pt-2 pb-2"
                                            onClick={() => setUpgradeMode("")}
                                        />
                                        
                                    </div>
                                )
                            }
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )

}

export default Upgrade;

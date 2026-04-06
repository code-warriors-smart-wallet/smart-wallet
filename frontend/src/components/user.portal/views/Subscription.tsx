import { useSelector } from "react-redux";
import { RootState } from "@/redux/store/store";
import { MdPayment, MdHistory, MdCardMembership, MdCheckCircle, MdStar, MdOutlineStars } from "react-icons/md";
import Button from "../../Button";
import { PlanType } from "../../../interfaces/modals";

function Subscription() {
    const { plan } = useSelector((state: RootState) => state.auth);

    const plans = [
        {
            name: PlanType.STARTER,
            price: "Free",
            description: "Perfect for individuals managing personal expenses.",
            features: [
                "Up to 5 Spaces",
                "Basic Expense Tracking",
                "Standard Reports",
                "Community Support"
            ],
            current: plan === PlanType.STARTER,
            icon: MdCardMembership,
            color: "text-gray-400"
        },
        {
            name: PlanType.PRO,
            price: "Rs. 990/mo",
            description: "Advanced tools for serious financial management.",
            features: [
                "Unlimited Spaces",
                "Advanced Analytics & AI",
                "Multi-device Sync",
                "Priority 24/7 Support",
                "Custom Categories",
                "Exportable Data (CSV/PDF)"
            ],
            current: plan === PlanType.PRO,
            icon: MdStar,
            color: "text-primary"
        }
    ];

    return (
        <div className="max-w-5xl mx-auto pb-16 px-4 animate-fade-in">
            {/* Header Section */}
            <div className="mb-12 text-center sm:text-left">
                <h1 className="text-4xl font-black text-text-light-primary dark:text-text-dark-primary tracking-tight">Subscription & Billing</h1>
                <p className="text-gray-500 mt-2 font-medium">Choose the plan that fits your financial goals.</p>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                {plans.map((p) => (
                    <div 
                        key={p.name} 
                        className={`relative p-8 rounded-3xl border-2 transition-all duration-300 flex flex-col shadow-xl 
                        ${p.current 
                            ? 'border-primary bg-primary/5 ring-4 ring-primary/10' 
                            : 'border-border-light-primary dark:border-border-dark-primary bg-bg-light-secondary dark:bg-bg-dark-secondary hover:border-primary/40'}`}
                    >
                        {p.current && (
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg flex items-center gap-1">
                                <MdOutlineStars size={14} /> Active Plan
                            </div>
                        )}

                        <div className="mb-8 mt-2">
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`p-2.5 rounded-xl bg-bg-light-primary dark:bg-black/20 shadow-inner ${p.color}`}>
                                    <p.icon size={28} />
                                </div>
                                <h3 className="text-2xl font-black text-text-light-primary dark:text-text-dark-primary uppercase tracking-tighter">{p.name}</h3>
                            </div>
                            <p className="text-gray-500 text-sm leading-relaxed min-h-[40px]">{p.description}</p>
                            <div className="mt-6 flex items-baseline gap-1">
                                <span className="text-4xl font-black text-primary">{p.price}</span>
                                {p.name !== PlanType.STARTER && <span className="text-gray-400 text-sm font-bold">/ month</span>}
                            </div>
                        </div>
                        
                        <div className="space-y-4 mb-10 flex-grow">
                            <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Included Features</p>
                            <ul className="space-y-4">
                                {p.features.map(f => (
                                    <li key={f} className="flex items-start gap-3 group">
                                        <MdCheckCircle size={20} className="text-primary mt-0.5 shrink-0" />
                                        <span className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary leading-tight group-hover:translate-x-1 transition-transform">
                                            {f}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {!p.current ? (
                            <Button 
                                text="Upgrade to Pro" 
                                onClick={() => {}} 
                                priority="primary" 
                                className="w-full py-4 rounded-2xl shadow-lg border-none hover:shadow-primary/20"
                            />
                        ) : (
                            <Button 
                                text="Current Subscriptions" 
                                disabled 
                                onClick={() => {}} 
                                priority="secondary" 
                                className="w-full py-4 rounded-2xl opacity-60 cursor-not-allowed border-none bg-gray-200 dark:bg-gray-800"
                            />
                        )}
                    </div>
                ))}
            </div>

            {/* Secondary Sections Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
                {/* Payment Methods */}
                <div className="bg-bg-light-secondary dark:bg-bg-dark-secondary p-10 rounded-3xl border border-border-light-primary dark:border-border-dark-primary shadow-xl group">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-primary/10 rounded-xl group-hover:scale-110 transition-transform">
                                <MdPayment className="text-primary text-2xl" />
                            </div>
                            <h3 className="text-xl font-bold text-text-light-primary dark:text-text-dark-primary">Payment Methods</h3>
                        </div>
                    </div>
                    
                    <div className="bg-bg-light-primary dark:bg-black/20 p-8 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 text-center flex flex-col items-center">
                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-full mb-4">
                            <MdPayment className="text-gray-300 dark:text-gray-600 text-3xl" />
                        </div>
                        <p className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">No Cards Saved</p>
                        <p className="text-xs text-gray-400 leading-relaxed max-w-[200px] mb-6">Safe, secure payment options powered by Stripe.</p>
                        
                        <Button 
                            text="Add Payment Method" 
                            onClick={() => {}} 
                            priority="secondary" 
                            className="w-auto px-8 rounded-xl h-10 text-xs border-primary/20 hover:border-primary/50 text-primary" 
                        />
                    </div>
                </div>

                {/* Billing History */}
                <div className="bg-bg-light-secondary dark:bg-bg-dark-secondary p-10 rounded-3xl border border-border-light-primary dark:border-border-dark-primary shadow-xl group">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-2.5 bg-primary/10 rounded-xl group-hover:scale-110 transition-transform">
                            <MdHistory className="text-primary text-2xl" />
                        </div>
                        <h3 className="text-xl font-bold text-text-light-primary dark:text-text-dark-primary">Billing History</h3>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-center h-[180px] text-center px-6">
                            <div>
                                <MdHistory className="mx-auto text-gray-200 dark:text-gray-800 text-5xl mb-4" />
                                <p className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">No Recent Activity</p>
                                <p className="text-xs text-gray-400 mt-2">When you subscribe, your invoices will appear here.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Footer Tip */}
            <div className="mt-12 text-center">
                <p className="text-xs text-gray-400 italic">Questions about your plan? <span className="text-primary font-bold cursor-pointer hover:underline">Contact Support</span></p>
            </div>
        </div>
    );
}

export default Subscription;
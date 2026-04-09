import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/store/store";
import { MdPayment, MdHistory, MdCardMembership, MdCheckCircle, MdStar, MdOutlineStars, MdCancel, MdMoreVert, MdDeleteOutline } from "react-icons/md";
import { FaCcVisa, FaCcMastercard, FaCcAmex, FaCcDiscover } from "react-icons/fa";
import Button from "../../Button";
import { PlanType, PaymentType } from "../../../interfaces/modals";
import { AuthService } from "../../../services/auth/auth.service";
import Upgrade from "./Subscription/Upgrade";
import { api } from "../../../config/api.config";
import { toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

function Subscription() {
    const { plan, subscriptionId, email } = useSelector((state: RootState) => state.auth);
    const [upgradeMode, setUpgradeMode] = useState<string>("");
    const [payments, setPayments] = useState<any[]>([]);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loadingPayments, setLoadingPayments] = useState(true);
    const [loadingInvoices, setLoadingInvoices] = useState(true);
    const { cancelSubscription } = AuthService();

    useEffect(() => {
        const fetchPayments = async () => {
            if (!email) return;
            try {
                const res = await api.get(`user/subscription/${email}/payments`);
                if (res.data.success) {
                    setPayments(res.data.data.object || []);
                }
            } catch (err) {
                console.error("Failed to fetch payments:", err);
            } finally {
                setLoadingPayments(false);
            }
        };

        const fetchInvoices = async () => {
            if (!email) return;
            try {
                const res = await api.get(`user/subscription/${email}/invoices`);
                if (res.data.success) {
                    setInvoices(res.data.data.object || []);
                }
            } catch (err) {
                console.error("Failed to fetch invoices:", err);
            } finally {
                setLoadingInvoices(false);
            }
        };

        fetchPayments();
        fetchInvoices();
    }, [email]);

    const getCardIcon = (type: string) => {
        switch (type?.toLowerCase()) {
            case 'visa': return <FaCcVisa className="text-[#1A1F71]" size={32} />;
            case 'mastercard': return <FaCcMastercard className="text-[#EB001B]" size={32} />;
            case 'amex': return <FaCcAmex className="text-[#007BC1]" size={32} />;
            default: return <MdPayment className="text-gray-400" size={32} />;
        }
    };

    const handleDeletePayment = async (paymentId: string) => {
        if (!window.confirm("Are you sure you want to delete this payment method?")) return;
        try {
            const res = await api.delete(`user/subscription/payments/${paymentId}`);
            if (res.data.success) {
                toast.success("Payment method deleted");
                setPayments(payments.filter(p => p._id !== paymentId));
            }
        } catch (err: any) {
            toast.error(err.response?.data?.error?.message || "Failed to delete payment method");
        }
    };

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
            current: (plan || PlanType.STARTER) === PlanType.STARTER,
            icon: MdCardMembership,
            color: "text-gray-400"
        },
        {
            name: PlanType.PLUS,
            price: "LKR 1999/mo",
            description: "Unlock the full power of your money and financial tools.",
            features: [
                "Unlimited Spaces",
                "Advanced AI Assistant",
                "Detailed Reports & Analytics",
                "Recurring Schedules & Budgets",
                "Custom Categories",
                "Loan Repayment Management"
            ],
            current: plan === PlanType.PLUS,
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
                                text={`Upgrade to ${p.name}`} 
                                onClick={() => setUpgradeMode("upgrade")} 
                                priority="primary" 
                                className="w-full py-4 rounded-2xl shadow-lg border-none hover:shadow-primary/20"
                            />
                        ) : p.name === PlanType.PLUS ? (
                            <Button 
                                text="Cancel Subscription" 
                                onClick={() => setUpgradeMode("upgrade")} 
                                priority="secondary" 
                                className="w-full py-4 rounded-2xl border-2 border-red-500/20 text-red-500 hover:bg-red-500/5 hover:border-red-500/50 transition-all font-bold"
                            />
                        ) : (
                            <Button 
                                text="Current Plan" 
                                disabled 
                                onClick={() => {}} 
                                priority="secondary" 
                                className="w-full py-4 rounded-2xl opacity-60 cursor-not-allowed border-none bg-gray-200 dark:bg-gray-800"
                            />
                        )}
                    </div>
                ))}
            </div>

            {upgradeMode !== "" && (
                <Upgrade message="Unlock all premium features today!" setUpgradeMode={setUpgradeMode} />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
                <div className="bg-bg-light-secondary dark:bg-bg-dark-secondary p-10 rounded-3xl border border-border-light-primary dark:border-border-dark-primary shadow-xl group">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-primary/10 rounded-xl group-hover:scale-110 transition-transform">
                                <MdPayment className="text-primary text-2xl" />
                            </div>
                            <h3 className="text-xl font-bold text-text-light-primary dark:text-text-dark-primary">Payment Methods</h3>
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        {loadingPayments ? (
                            <div className="flex justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                            </div>
                        ) : payments.length > 0 ? (
                            payments.map((p) => (
                                <div key={p._id} className="bg-bg-light-primary dark:bg-black/20 p-5 rounded-2xl border border-border-light-primary dark:border-border-dark-primary flex items-center justify-between group/card hover:border-primary/50 transition-all shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm">
                                            {getCardIcon(p.details?.cardType || 'visa')}
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-text-light-primary dark:text-text-dark-primary uppercase tracking-wider">
                                                {p.type === PaymentType.CREDIT_CARD ? 'Credit Card' : 'Debit Card'}
                                            </p>
                                            <p className="text-xs text-gray-500 font-bold tracking-widest mt-0.5">
                                                •••• •••• •••• {p.details?.lastFourDigits || '0000'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {p.isDefault && (
                                            <span className="text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded-md mr-2">Default</span>
                                        )}
                                        <button 
                                            onClick={() => handleDeletePayment(p._id)}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all opacity-0 group-hover/card:opacity-100"
                                        >
                                            <MdDeleteOutline size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
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
                        )}
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
                        {loadingInvoices ? (
                            <div className="flex justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                            </div>
                        ) : invoices.length > 0 ? (
                            <div className="space-y-3">
                                {invoices.map((inv) => (
                                    <div key={inv._id} className="flex items-center justify-between p-4 bg-bg-light-primary dark:bg-black/20 rounded-xl border border-border-light-primary dark:border-border-dark-primary hover:border-primary/30 transition-all group/inv">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-600">
                                                <MdCheckCircle size={18} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-text-light-primary dark:text-text-dark-primary uppercase tracking-tight">
                                                    {inv.planId?.name} Plan Subscription
                                                </p>
                                                <p className="text-[10px] text-gray-500 font-bold uppercase mt-0.5">
                                                    {new Date(inv.billingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-black text-primary tracking-tighter">LKR {inv.amount}</p>
                                            <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mt-0.5">Paid</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-[180px] text-center px-6">
                                <div>
                                    <MdHistory className="mx-auto text-gray-200 dark:text-gray-800 text-5xl mb-4" />
                                    <p className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">No Recent Activity</p>
                                    <p className="text-xs text-gray-400 mt-2">When you subscribe, your invoices will appear here.</p>
                                </div>
                            </div>
                        )}
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
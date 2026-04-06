import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store/store';
import { 
    MdPayment, MdPerson, MdCreditCard, MdLock, MdInfo, MdAdd, MdCalendarToday 
} from 'react-icons/md';
import { 
    FaCcVisa, FaCcMastercard, FaCcAmex, FaCcDiscover, FaCcDinersClub, FaQuestionCircle
} from 'react-icons/fa';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { PaymentType } from '../../interfaces/modals';
import { toast } from 'react-toastify';
import { api } from '../../config/api.config';

function PaymentGateway() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { email, username } = useSelector((state: RootState) => state.auth);
    
    const [selectedMethod, setSelectedMethod] = useState<PaymentType>(PaymentType.CREDIT_CARD);
    const [loading, setLoading] = useState(false);
    const [cardDetails, setCardDetails] = useState({
        number: '',
        expiry: '',
        cvv: '',
        name: username || ''
    });

    const handlePayment = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setLoading(true);
        
        try {
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const response = await api.post(`user/subscription/${id}/activate`, {
                email: email,
                paymentId: "mock_payment_id_" + Math.random().toString(36).substr(2, 9)
            });

            const data = response.data;

            if (data.success) {
                toast.success("Upgrade Successful! Plus features unlocked.");
                navigate('/user-portal/all/all/Dashboard');
            } else {
                toast.error(data.error?.message || "Payment activation failed.");
            }
        } catch (error) {
            toast.error("An unexpected error occurred during payment.");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-bg-light-primary dark:bg-bg-dark-primary p-4 lg:p-12 font-main flex justify-center">
            <div className="max-w-6xl w-full">
                {/* Top Header Bar */}
                <div className="flex justify-between items-center bg-white dark:bg-bg-dark-secondary p-4 rounded-t-xl border-b border-border-light-primary dark:border-border-dark-primary shadow-sm">
                    <h2 className="text-sm font-black uppercase tracking-widest text-text-light-primary dark:text-text-dark-primary flex items-center gap-2">
                        <MdPayment className="text-primary" size={20} />
                        Payment Details
                    </h2>
                    <button className="flex items-center gap-1 text-xs font-bold bg-secondary-100 dark:bg-secondary-800 text-text-light-primary dark:text-text-dark-primary px-3 py-1.5 rounded-md hover:bg-secondary-200 transition-colors">
                        <MdAdd size={16} />
                        Add
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-white dark:bg-bg-dark-secondary p-8 rounded-b-xl shadow-xl border-x border-b border-border-light-primary dark:border-border-dark-primary transition-all duration-300">
                    
                    {/* Left Column: Form Details (8/12) */}
                    <div className="lg:col-span-8 space-y-8">
                        <div>
                            <h1 className="text-2xl font-black text-text-light-primary dark:text-text-dark-primary mb-1">Add new Payment Details</h1>
                            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary opacity-70">You can pay your invoice with Card or via Bank Debit</p>
                        </div>

                        {/* Payment Method Toggles */}
                        <div className="flex gap-0 rounded-lg overflow-hidden border border-border-light-primary dark:border-border-dark-primary max-w-md">
                            <button
                                type="button"
                                onClick={() => setSelectedMethod(PaymentType.CREDIT_CARD)}
                                className={`flex-1 py-3 text-sm font-bold transition-all ${
                                    selectedMethod === PaymentType.CREDIT_CARD
                                    ? 'bg-primary text-white shadow-inner'
                                    : 'bg-transparent text-text-light-secondary dark:text-text-dark-secondary hover:bg-secondary-50 dark:hover:bg-secondary-900'
                                }`}
                            >
                                Pay With Credit Card
                            </button>
                            <button
                                type="button"
                                onClick={() => setSelectedMethod(PaymentType.PAYPAL)} // Using PAYPAL as proxy for Bank Debit for now
                                className={`flex-1 py-3 text-sm font-bold transition-all border-l border-border-light-primary dark:border-border-dark-primary ${
                                    selectedMethod === PaymentType.PAYPAL
                                    ? 'bg-primary text-white shadow-inner'
                                    : 'bg-transparent text-text-light-secondary dark:text-text-dark-secondary hover:bg-secondary-50 dark:hover:bg-secondary-900'
                                }`}
                            >
                                Pay With Bank Debit
                            </button>
                        </div>

                        {/* Merchant Accepts Stripe */}
                        <div className="space-y-3">
                            <p className="text-xs font-black uppercase text-text-light-primary dark:text-text-dark-primary tracking-widest opacity-60">Merchant Accepts:</p>
                            <div className="flex flex-wrap gap-4 items-center grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
                                <FaCcAmex size={28} className="text-[#007bc1]" title="American Express" />
                                <FaCcMastercard size={28} className="text-[#eb001b]" title="Mastercard" />
                                <FaCcVisa size={28} className="text-[#1a1f71]" title="Visa" />
                                <FaCcDiscover size={28} className="text-[#ff6000]" title="Discover" />
                                <FaCcDinersClub size={28} className="text-[#004a97]" title="Diners Club" />
                                <MdInfo size={22} className="text-gray-400 cursor-help" />
                            </div>
                        </div>

                        {/* Card Details Form */}
                        <div className="space-y-6 pt-4 border-t border-border-light-primary dark:border-border-dark-primary">
                            <h3 className="text-lg font-black text-text-light-primary dark:text-text-dark-primary">Card Details</h3>
                            
                            <form onSubmit={handlePayment} className="space-y-6">
                                <div className="max-w-xl">
                                    <Input
                                        label="Name on the card"
                                        name="cardName"
                                        type="text"
                                        placeholder="Mr John Snow"
                                        value={cardDetails.name}
                                        onChange={(e) => setCardDetails({...cardDetails, name: e.target.value})}
                                        className="h-12 border-border-light-primary dark:border-border-dark-primary bg-bg-light shadow-sm"
                                    />
                                </div>
                                <div className="max-w-xl relative">
                                    <Input
                                        label="Card Number"
                                        name="cardNumber"
                                        type="text"
                                        placeholder="4444 4444 4444 4444"
                                        value={cardDetails.number}
                                        onChange={(e) => setCardDetails({...cardDetails, number: e.target.value})}
                                        className="h-12 border-border-light-primary dark:border-border-dark-primary bg-bg-light shadow-sm pr-12"
                                    />
                                    <div className="absolute right-4 bottom-3 transition-transform hover:scale-110">
                                        <FaCcVisa size={24} className="text-[#1a1f71]" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-xl">
                                    <Input
                                        label="Expiry Date"
                                        name="expiry"
                                        type="text"
                                        placeholder="12/23"
                                        value={cardDetails.expiry}
                                        onChange={(e) => setCardDetails({...cardDetails, expiry: e.target.value})}
                                        className="h-12 border-border-light-primary dark:border-border-dark-primary bg-bg-light shadow-sm"
                                    />
                                    <div className="relative">
                                        <Input
                                            label="CVV"
                                            name="cvv"
                                            placeholder="4355"
                                            type="password"
                                            value={cardDetails.cvv}
                                            onChange={(e) => setCardDetails({...cardDetails, cvv: e.target.value})}
                                            className="h-12 border-border-light-primary dark:border-border-dark-primary bg-bg-light shadow-sm pr-10"
                                        />
                                        <FaQuestionCircle size={18} className="absolute right-4 bottom-3.5 text-primary cursor-help opacity-70 hover:opacity-100" />
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 py-2">
                                    <input 
                                        type="checkbox" 
                                        id="storeCard" 
                                        className="w-4 h-4 rounded border-border-light-primary dark:border-border-dark-primary text-primary focus:ring-primary accent-primary cursor-pointer"
                                    />
                                    <label htmlFor="storeCard" className="text-sm font-bold text-text-light-secondary dark:text-text-dark-secondary cursor-pointer hover:text-primary transition-colors">
                                        Store credit card for future payments
                                    </label>
                                </div>

                                <div className="flex justify-start">
                                    <Button
                                        text="Save Details"
                                        type="button" // In the image this looks like a 'Save' not 'Final Pay'
                                        className="px-10 h-12 rounded-lg font-bold shadow-lg shadow-primary/10 tracking-wide"
                                        onClick={() => toast.info("Card details saved.")}
                                    />
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Right Column: Checkout Summary (4/12) */}
                    <div className="lg:col-span-4">
                        <div className="sticky top-8 bg-bg-light-primary dark:bg-bg-dark-primary/50 p-8 rounded-2xl border border-border-light-primary dark:border-border-dark-primary shadow-2xl">
                            <div className="space-y-8">
                                <div className="flex justify-between items-start">
                                    <h4 className="text-sm font-black uppercase text-text-light-secondary dark:text-text-dark-secondary tracking-widest opacity-60">Total Charge</h4>
                                    <div className="text-right">
                                        <p className="text-4xl font-black text-text-light-primary dark:text-text-dark-primary tracking-tighter">$133.90</p>
                                        <p className="text-xs font-bold text-primary uppercase tracking-widest mt-1">/ Recurring Monthly</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <button 
                                        type="button"
                                        className="flex items-center justify-center gap-2 py-3 border border-border-light-primary dark:border-border-dark-primary rounded-xl font-black uppercase text-[10px] tracking-widest text-text-light-primary dark:text-text-dark-primary hover:bg-secondary-50 dark:hover:bg-secondary-900 transition-all active:scale-95"
                                    >
                                        <MdCalendarToday size={14} className="text-primary" />
                                        Schedule
                                    </button>
                                    <Button
                                        text={loading ? "..." : "Pay Now"}
                                        disabled={loading}
                                        className="w-full py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 active:scale-95"
                                        onClick={handlePayment}
                                    />
                                </div>

                                <div className="pt-6 border-t border-border-light-primary dark:border-border-dark-primary/30">
                                    <div className="flex items-center gap-2 mb-4">
                                        <MdLock className="text-green-500" />
                                        <span className="text-[10px] font-black uppercase text-text-light-secondary dark:text-text-dark-secondary tracking-widest">Secured 256-bit Connection</span>
                                    </div>
                                    <p className="text-[10px] leading-relaxed text-text-light-secondary dark:text-text-dark-secondary opacity-60 font-bold">
                                        By clicking "Pay Now", you authorize Smart Wallet to charge your payment method for this and future recurring subscriptions.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <button 
                        type="button"
                        onClick={() => navigate(-1)}
                        className="text-xs font-black uppercase text-gray-500 tracking-widest hover:text-primary transition-colors py-2 border-b-2 border-transparent hover:border-primary"
                    >
                        Back to Plans
                    </button>
                </div>
            </div>
        </div>
    );
}

export default PaymentGateway;

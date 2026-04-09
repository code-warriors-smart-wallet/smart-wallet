import React, { useState, useEffect } from 'react';
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
import { PaymentType, PlanInfo, PlanType } from '../../interfaces/modals';
import { toast } from 'react-toastify';
import { api } from '../../config/api.config';
import { useDispatch } from 'react-redux';
import { updateUser } from '../../redux/features/auth';

function PaymentGateway() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { email, username, currency: userCurrency } = useSelector((state: RootState) => state.auth);
    
    const [selectedMethod, setSelectedMethod] = useState<PaymentType>(PaymentType.CREDIT_CARD);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [plan, setPlan] = useState<PlanInfo | null>(null);
    const [savedPayments, setSavedPayments] = useState<any[]>([]);
    const [selectedSavedPaymentId, setSelectedSavedPaymentId] = useState<string | null>(null);
    const [isAddingNewCard, setIsAddingNewCard] = useState(false);
    const [loadingPayments, setLoadingPayments] = useState(true);
    const [cardDetails, setCardDetails] = useState({
        number: '',
        expiry: '',
        cvv: '',
        name: username || ''
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validateField = (name: string, value: string) => {
        let error = "";
        switch (name) {
            case 'number':
                const cleanNumber = value.replace(/\s+/g, '');
                if (!/^\d*$/.test(cleanNumber)) error = "Only digits allowed.";
                else if (cleanNumber.length > 16) error = "Maximum 16 digits.";
                break;
            case 'expiry':
                if (!/^\d{0,2}\/?\d{0,2}$/.test(value)) {
                    error = "Use MM/YY format.";
                } else {
                    const now = new Date();
                    const currentYear = now.getFullYear() % 100; // 26
                    const currentMonth = now.getMonth() + 1; // 4 (April)

                    if (value.length >= 2) {
                        const month = parseInt(value.slice(0, 2));
                        if (month < 1 || month > 12) error = "Month must be 01-12.";
                    }
                    
                    if (value.length === 5) {
                        const month = parseInt(value.slice(0, 2));
                        const year = parseInt(value.slice(3, 5));
                        
                        if (year < currentYear) {
                            error = "The card is expired.";
                        } else if (year === currentYear && month < currentMonth) {
                            error = "The card is expired.";
                        }
                    }
                }
                break;
            case 'cvv':
                if (!/^\d*$/.test(value)) error = "Only digits allowed.";
                else if (value.length > 4) error = "Maximum 4 digits.";
                break;
            case 'name':
                if (!/^[a-zA-Z\s\.]*$/.test(value)) error = "Invalid characters in name.";
                break;
        }
        setErrors(prev => ({ ...prev, [name]: error }));
        return error === "";
    };

    const handleInputChange = (name: string, value: string) => {
        let formattedValue = value;
        
        if (name === 'number') {
            const clean = value.replace(/\s+/g, '').slice(0, 16);
            formattedValue = clean.replace(/(\d{4})(?=\d)/g, '$1 ');
        } else if (name === 'expiry') {
            const clean = value.replace(/\//g, '').slice(0, 4);
            if (clean.length >= 2) {
                const month = parseInt(clean.slice(0, 2));
                if (month > 12) return; // Block invalid months
                if (clean.length > 2) {
                    formattedValue = `${clean.slice(0, 2)}/${clean.slice(2)}`;
                } else {
                    formattedValue = clean;
                }
            } else {
                formattedValue = clean;
            }
        } else if (name === 'cvv') {
            formattedValue = value.slice(0, 4);
        }

        setCardDetails(prev => ({ ...prev, [name]: formattedValue }));
        validateField(name, formattedValue);
    };

    useEffect(() => {
        const fetchSubscriptionData = async () => {
            try {
                const response = await api.get(`user/subscription/${id}`);
                if (response.data.success) {
                    setPlan(response.data.data.object.planId);
                }
            } catch (error) {
                console.error("Error fetching subscription:", error);
                toast.error("Could not load payment details.");
            } finally {
                setFetching(false);
            }
        };

        const fetchSavedPayments = async () => {
            if (!email) return;
            try {
                const res = await api.get(`user/subscription/${email}/payments`);
                if (res.data.success) {
                    const payments = res.data.data.object || [];
                    setSavedPayments(payments);
                    
                    if (payments.length > 0) {
                        const defaultCard = payments.find((p: any) => p.isDefault) || payments[0];
                        setSelectedSavedPaymentId(defaultCard._id);
                        setIsAddingNewCard(false);
                    } else {
                        setIsAddingNewCard(true);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch saved payments:", err);
            } finally {
                setLoadingPayments(false);
            }
        };

        if (id) {
            fetchSubscriptionData();
            fetchSavedPayments();
        }
    }, [id, email]);

    const validateForm = () => {
        let isValid = true;
        
        // Deep validation on all fields
        const isNumValid = validateField('number', cardDetails.number);
        const isExpValid = validateField('expiry', cardDetails.expiry);
        const isCvvValid = validateField('cvv', cardDetails.cvv);
        const isNameValid = validateField('name', cardDetails.name);

        if (!isNumValid || !isExpValid || !isCvvValid || !isNameValid) isValid = false;

        const cardNumberClean = cardDetails.number.replace(/\s+/g, '');
        if (cardNumberClean.length !== 16) {
            setErrors(prev => ({ ...prev, number: "Card number must be 16 digits." }));
            isValid = false;
        }

        if (cardDetails.expiry.length !== 5) {
            setErrors(prev => ({ ...prev, expiry: "Expiry must be MM/YY." }));
            isValid = false;
        }

        return isValid;
    };

    const handlePayment = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        // If not using a saved card, validate the form
        if (!selectedSavedPaymentId && selectedMethod === PaymentType.CREDIT_CARD && !validateForm()) {
            toast.error("Please fix the errors in the form.");
            return;
        }

        setLoading(true);
        const processingToast = toast.info("Processing Payment...", { autoClose: false });

        try {
            // Determine payment ID and parameters
            const paymentIdToUse = selectedSavedPaymentId || "mock_payment_id_" + Math.random().toString(36).substr(2, 9);
            const nameToUse = selectedSavedPaymentId 
                ? savedPayments.find(p => p._id === selectedSavedPaymentId)?.details?.cardName || username 
                : cardDetails.name;

            console.log(">>>> Attempting backend activation for sub:", id);

            // Real backend attempt
            const response = await api.post(`user/subscription/${id}/activate`, {
                email: email,
                paymentId: paymentIdToUse,
                cardName: nameToUse,
                paymentType: selectedMethod
            });

            if (response.data.success) {
                console.log(">>>> Backend activation success!");
                await completeMockSuccess();
            } else {
                toast.error(response.data.error?.message || "Payment activation failed.");
            }
        } catch (error: any) {
            console.error("Backend activation error:", error);
            const errorMsg = error.response?.data?.error?.message || "An error occurred during payment activation.";
            toast.error(errorMsg);
        } finally {
            toast.dismiss(processingToast);
            setLoading(false);
        }
    };

    const completeMockSuccess = async () => {
        const targetPlan = (plan?.name as any) || PlanType.PLUS;
        
        // Save Payment details officially in DB IF it's a new card
        if (!selectedSavedPaymentId) {
            try {
                await api.post('user/subscription/payments', {
                    email: email,
                    type: selectedMethod,
                    details: {
                        lastFourDigits: cardDetails.number.replace(/\s+/g, '').slice(-4),
                        expiryDate: cardDetails.expiry,
                        cardType: 'Visa', // Mocking card type detection for now
                        cardName: cardDetails.name
                    },
                    isDefault: savedPayments.length === 0
                });
            } catch (err) {
                console.error("Failed to save payment record:", err);
                // Non-blocking for the flow success
            }
        }

        // Update Redux State
        dispatch(updateUser({
            plan: targetPlan,
            subscriptionId: id
        }));

        // Update LocalStorage to persist
        const userData = JSON.parse(localStorage.getItem('smart-wallet-user') || '{}');
        userData.plan = targetPlan;
        userData.subscriptionId = id;
        localStorage.setItem('smart-wallet-user', JSON.stringify(userData));

        toast.success(`Success! Your plan has been upgraded to ${targetPlan}.`);
        
        // Redirect after a short delay
        setTimeout(() => {
            navigate('/user-portal/all/all/Dashboard');
        }, 1500);
    };

    const getPriceDisplay = () => {
        if (!plan) return "...";
        const price = plan.monthly_price;
        const currency = userCurrency || plan.currency || '$';
        
        return `${currency} ${price.toFixed(2)}`;
    };

    if (fetching) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-bg-light-primary dark:bg-bg-dark-primary">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

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
                            <h1 className="text-2xl font-black text-text-light-primary dark:text-text-dark-primary mb-1">
                                {savedPayments.length > 0 ? "Choose Payment Method" : "Add new Payment Details"}
                            </h1>
                            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary opacity-70">
                                {savedPayments.length > 0 ? "Select a saved card or enter new details." : "You can pay your invoice with Card or via Bank Debit"}
                            </p>
                        </div>

                        {/* Saved Cards Section */}
                        {savedPayments.length > 0 && (
                            <div className="space-y-4">
                                <p className="text-xs font-black uppercase text-text-light-primary dark:text-text-dark-primary tracking-widest opacity-60 flex items-center gap-2">
                                    <MdCreditCard size={14} className="text-primary" /> Your Saved Cards
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {savedPayments.map((p) => (
                                        <div 
                                            key={p._id}
                                            onClick={() => {
                                                setSelectedSavedPaymentId(p._id);
                                                setIsAddingNewCard(false);
                                            }}
                                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between group h-20 ${
                                                selectedSavedPaymentId === p._id 
                                                ? 'border-primary bg-primary/5 shadow-md scale-[1.02]' 
                                                : 'border-border-light-primary dark:border-border-dark-primary bg-secondary-50/30 dark:bg-black/20 hover:border-primary/50'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="bg-white dark:bg-gray-800 p-1.5 rounded-md shadow-sm">
                                                    {p.details?.cardType?.toLowerCase() === 'visa' ? <FaCcVisa size={24} className="text-[#1A1F71]" /> : <FaCcMastercard size={24} className="text-[#EB001B]" />}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-text-light-primary dark:text-text-dark-primary">•••• {p.details?.lastFourDigits}</p>
                                                    <p className="text-[10px] text-gray-500 font-bold uppercase">{p.details?.expiryDate}</p>
                                                </div>
                                            </div>
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selectedSavedPaymentId === p._id ? 'border-primary bg-primary' : 'border-gray-300'}`}>
                                                {selectedSavedPaymentId === p._id && <div className="w-2 h-2 bg-white rounded-full animate-in zoom-in duration-200"></div>}
                                            </div>
                                        </div>
                                    ))}
                                    <div 
                                        onClick={() => {
                                            setSelectedSavedPaymentId(null);
                                            setIsAddingNewCard(true);
                                        }}
                                        className={`p-4 rounded-xl border-2 border-dashed cursor-pointer transition-all flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest h-20 ${
                                            isAddingNewCard
                                            ? 'border-primary bg-primary/5 text-primary shadow-md scale-[1.02]' 
                                            : 'border-gray-300 dark:border-gray-700 text-gray-400 hover:border-primary/50 hover:text-primary'
                                        }`}
                                    >
                                        <MdAdd size={20} /> Add New Card/Method
                                    </div>
                                </div>
                            </div>
                        )}

                        {isAddingNewCard && (
                            <div className="animate-in fade-in slide-in-from-top-4 duration-500 space-y-8">
                                <div className="flex items-center gap-3 pt-4 border-t border-border-light-primary dark:border-border-dark-primary">
                                    <div className="w-1 h-6 bg-primary rounded-full"></div>
                                    <h3 className="text-sm font-black uppercase text-text-light-primary dark:text-text-dark-primary tracking-widest">New Payment Method</h3>
                                </div>

                                <div className="space-y-6">
                                    {/* Payment Method Toggles - Only Card remains */}
                                    <div className="flex gap-0 rounded-lg overflow-hidden border border-border-light-primary dark:border-border-dark-primary max-w-xs">
                                        <button
                                            type="button"
                                            disabled // Disable toggle as it's the only option
                                            className={`flex-1 py-3 px-4 text-[10px] font-black uppercase tracking-wider transition-all bg-primary text-white shadow-inner`}
                                        >
                                            <span className="flex items-center justify-center gap-2">
                                                <MdCreditCard size={14} /> Cards & Local Bank
                                            </span>
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

                                    {/* Only Card details allowed */}
                                    <div className="space-y-6 pt-4 border-t border-border-light-primary dark:border-border-dark-primary animate-in fade-in slide-in-from-top-2 duration-300">
                                        <h3 className="text-lg font-black text-text-light-primary dark:text-text-dark-primary">Card Details</h3>
                                        
                                        <form onSubmit={handlePayment} className="space-y-6">
                                            <div className="max-w-xl">
                                                <Input
                                                    label="Name on the Card"
                                                    name="cardName"
                                                    type="text"
                                                    placeholder="Mr John Snow"
                                                    value={cardDetails.name}
                                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                                    error={errors.name}
                                                    className="h-12 border-border-light-primary dark:border-border-dark-primary bg-bg-light shadow-sm"
                                                />
                                            </div>
                                            <div className="max-w-xl relative">
                                                <Input
                                                    label="Card Number"
                                                    name="cardNumber"
                                                    type="text"
                                                    placeholder="xxxx xxxx xxxx xxxx"
                                                    value={cardDetails.number}
                                                    onChange={(e) => handleInputChange('number', e.target.value)}
                                                    error={errors.number}
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
                                                    placeholder="MM/YY"
                                                    value={cardDetails.expiry}
                                                    onChange={(e) => handleInputChange('expiry', e.target.value)}
                                                    error={errors.expiry}
                                                    className="h-12 border-border-light-primary dark:border-border-dark-primary bg-bg-light shadow-sm"
                                                />
                                                <div className="relative">
                                                    <Input
                                                        label="CVV"
                                                        name="cvv"
                                                        placeholder="xxx"
                                                        type="text"
                                                        value={cardDetails.cvv}
                                                        onChange={(e) => handleInputChange('cvv', e.target.value)}
                                                        error={errors.cvv}
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
                                                    type="button" 
                                                    className="px-10 h-12 rounded-lg font-bold shadow-lg shadow-primary/10 tracking-wide"
                                                    onClick={() => {
                                                        if(validateForm()) toast.success("Card details validated and saved.");
                                                        else toast.error("Please fix the errors before saving.");
                                                    }}
                                                />
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Checkout Summary (4/12) */}
                    <div className="lg:col-span-4">
                        <div className="sticky top-8 bg-bg-light-primary dark:bg-bg-dark-primary/50 p-8 rounded-2xl border border-border-light-primary dark:border-border-dark-primary shadow-2xl overflow-hidden">
                            {/* Decorative Background Element */}
                            <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary/5 rounded-full blur-3xl"></div>
                            
                            <div className="space-y-8 relative z-10">
                                <div className="flex justify-between items-start">
                                    <h4 className="text-sm font-black uppercase text-text-light-secondary dark:text-text-dark-secondary tracking-widest opacity-60">Total Charge</h4>
                                    <div className="text-right">
                                        <p className="text-3xl font-black text-text-light-primary dark:text-text-dark-primary tracking-tighter transition-all hover:scale-105 duration-300">
                                            {getPriceDisplay()}
                                        </p>
                                        <p className="text-[10px] font-bold text-primary uppercase tracking-widest mt-1">/ Recurring Monthly</p>
                                    </div>
                                </div>

                                <div className="p-4 bg-white dark:bg-bg-dark-secondary rounded-xl border border-border-light-primary dark:border-border-dark-primary shadow-sm space-y-2">
                                    <div className="flex justify-between text-xs font-bold">
                                        <span className="opacity-60">{plan?.name || "Plan"} Subscription</span>
                                        <span>{getPriceDisplay()}</span>
                                    </div>
                                    <div className="flex justify-between text-[10px] font-bold text-green-500">
                                        <span>Feature Access</span>
                                        <span>Included</span>
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
                                        className={`w-full py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 active:scale-95 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
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

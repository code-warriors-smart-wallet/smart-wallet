import axios from 'axios';
import { api } from '../../config/api.config';
import { PlanInfo, PlanType, RegistrationInfo, SendOtpRequest, SubscribeRequest, verifyOtpRequest, UpdateCurrencyRequest, LoginInfo, LoginStatus } from '../../interfaces/modals';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginSuccess, logout, setEmail, setOTPAttemptsRemaining } from '../../redux/features/auth';
import { UserPortalView } from '../../components/user.portal/SideBar';
import { RootState } from '@/redux/store/store';
import store from '../../redux/store/store';
import { refreshAccessToken } from '../../config/api.config';

export function AuthService() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const token = useSelector((state: RootState) => state.auth.token)

    async function register(body: RegistrationInfo): Promise<void> {
        try {
            const response = await api.post(`user/auth/register`, body);
            console.log(response.data)
            if (response.data.success) {
                dispatch(setEmail({ email: response.data.data.object.email }))
                await sendOTP({ email: response.data.data.object.email })
            }
        } catch (error) {
            processError(error);
        }
    }

    async function sendOTP(body: SendOtpRequest): Promise<void> {
        try {
            const response = await api.post(`user/auth/resend-otp`, body);
            console.log(response.data)
            if (response.data.success) {
                dispatch(setOTPAttemptsRemaining({ OTPAttemptsRemaining: response.data.data.object.attemptsRemaining }))
                navigate("/verify-otp");
                toast.info("Verification OTP has been sent to your email");
            }
        } catch (error) {
            processError(error);
        }
    }

    async function verifyOTP(body: verifyOtpRequest, navigateTo: string): Promise<void> {
        try {
            const response = await api.post(`user/auth/verify-otp`, body);
            console.log(response.data)
            if (response.data.success) {
                dispatch(setOTPAttemptsRemaining({ OTPAttemptsRemaining: 3 }))
                navigate(navigateTo)
            }
        } catch (error) {
            processError(error)
        }
    }

    async function getAllPlans(): Promise<PlanInfo[]> {
        try {
            const response = await api.get(`user/plan/all`);
            console.log(response.data)
            if (response.data.success) {
                return response.data.data.object as PlanInfo[];
            }
            return []
        } catch (error) {
            processError(error)
            return []
        }
    }

    async function protectedRoute(): Promise<void> {
        try {
            console.log("sending protected route request")
            const response = await api.get(`user/auth/protected`, {
                headers: {
                    "authorization": `Bearer ${token}`
                }
            });
            console.log(response.data)
            toast.info(response.data.message);
            // if (response.data.success) {
            //     return response.data.data.object as PlanInfo[];
            // }
        } catch (error) {
            processError(error)
        }
    }

    async function subscribePlan(body: SubscribeRequest, planName: string): Promise<void> {
        try {
            console.log("Subscribing to plan:", planName, body);
            const response = await api.post(`user/subscription/subscribe`, body);
            console.log("Subscribe response:", response.data);

            if (response.data.success) {
                const subObject = response.data.data.object;
                const subId = subObject.id || subObject._id;

                if (planName.toLowerCase() === PlanType.STARTER.toLowerCase()) {
                    navigate('/currency', { state: { email: subObject.email } });
                } else {
                    console.log("Navigating to payment for subscription:", subId);
                    navigate(`/subscriptions/${subId}/payment`);
                }
            }
        } catch (error) {
            processError(error);
        }
    }

    async function cancelSubscription(subscriptionId: string): Promise<boolean> {
        try {
            const { email } = store.getState().auth;
            const response = await api.patch(`user/subscription/${subscriptionId}/cancel`, { email });
            if (response.data.success) {
                toast.success("Subscription cancelled successfully. You will revert to the Starter plan.");
                // Refresh user data to update plan status
                await refreshAccessToken();
                return true;
            }
            return false;
        } catch (error) {
            processError(error);
            return false;
        }
    }

    async function updateCurrency(body: UpdateCurrencyRequest, navigateTo: string): Promise<void> {
        try {
            const response = await api.patch(`user/auth/update-currency`, body);
            console.log(response.data)
            if (response.data.success) {
                toast.success("Currency updated successfully!");
                navigate(navigateTo);
            }
        } catch (error) {
            processError(error);
        }
    }

    async function login(body: LoginInfo, redirect?: string) {
        try {
            const response = await api.post(`user/auth/login`, body, { withCredentials: true });
            console.log(response.data)
            if (response.data.success) {
                localStorage.setItem("smart-wallet-token", response.data.data.object.accessToken);
                const userData = {
                    id: response.data.data.object.id || response.data.data.object._id,
                    username: response.data.data.object.username,
                    email: response.data.data.object.email,
                    token: response.data.data.object.accessToken,
                    currency: response.data.data.object.currency,
                    plan: response.data.data.object.plan,
                    subscriptionId: response.data.data.object.subscriptionId,
                    profileImgUrl: response.data.data.object.profileImgUrl,
                    role: response.data.data.object.role,
                    theme: response.data.data.object.theme,
                    spaces: response.data.data.object.spaces
                }
                dispatch(loginSuccess(userData))
                console.log(response.data.data.object.spaces)
                toast.success("Login successful!");
                if (redirect) {
                    navigate(redirect);
                } else {
                    navigate(`/user-portal/all/all/${UserPortalView.DASHBOARD}`);
                }
            }
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                const errorMessage = error.response.data?.data?.message || "An error occurred while processing your request.";
                const status = error.response.data?.data?.object.status
                if (status === LoginStatus.BLOCKED || status === LoginStatus.INVALID_CREDENTIALS) {
                    toast.error(errorMessage);
                } else if (status === LoginStatus.VERIFICATION_REQUIRED) {
                    toast.error(errorMessage);
                    await sendOTP({email: body.email })
                } else {
                    processError(error)
                }
            } else {
                toast.error("An unexpected error occurred. Please try again later.");
            }
            console.error("Error details:", error);
        }
    }

    async function loginWithGoogle(body: {token: string, currency?: string}, redirect: string) {
        try {
            const response = await api.post(`user/auth/google`, body, { withCredentials: true });
            console.log(response.data)
            if (response.data.success) {
                const userData = {
                    id: response.data.data.object.id || response.data.data.object._id,
                    username: response.data.data.object.username,
                    email: response.data.data.object.email,
                    token: response.data.data.object.accessToken,
                    currency: response.data.data.object.currency,
                    plan: response.data.data.object.plan,
                    subscriptionId: response.data.data.object.subscriptionId,
                    profileImgUrl: response.data.data.object.profileImgUrl,
                    role: response.data.data.object.role,
                    theme: response.data.data.object.theme,
                    spaces: response.data.data.object.spaces
                }
                dispatch(loginSuccess(userData))
                toast.success("Login successful!");
                if (redirect) {
                    navigate(redirect);
                } else {
                    navigate(`/user-portal/all/all/${UserPortalView.DASHBOARD}`);
                }
            }
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                const errorMessage = error.response.data?.data?.message || "An error occurred while processing your request.";
                const status = error.response.data?.data?.object.status
                if (status === LoginStatus.BLOCKED || status === LoginStatus.INVALID_CREDENTIALS) {
                    toast.error(errorMessage);
                } else if (status === LoginStatus.VERIFICATION_REQUIRED) {
                    toast.error(errorMessage);
                    await sendOTP({email: error.response.data?.data?.object.email })
                } else {
                    processError(error)
                }
            } else {
                toast.error("An unexpected error occurred. Please try again later.");
            }
            console.error("Error details:", error);
        }
    }

    const logOut = async () => {
        try {
            const response = await api.post(`user/auth/logout`, {}, { withCredentials: true }); 
            dispatch(logout());
            navigate("/login")
        } catch (error) {
            console.log(error)
            dispatch(logout());
            navigate("/login")
        }
    };

    return { register, sendOTP, verifyOTP, getAllPlans, subscribePlan, cancelSubscription, updateCurrency, login, loginWithGoogle, protectedRoute, logOut };
}

function processError(error: unknown): void {
    if (axios.isAxiosError(error) && error.response) {
        const errorMessage = error.response.data?.error?.message || "An error occurred while processing your request.";
        toast.error(errorMessage);
    } else {
        toast.error("An unexpected error occurred. Please try again later.");
    }
    console.error("Error details:", error);
}

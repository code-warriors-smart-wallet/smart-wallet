import axios from 'axios';
import { api } from '../../config/api.config';
import { PlanInfo, PlanType, RegistrationInfo, SendOtpRequest, SubscribeRequest, verifyOtpRequest, UpdateCurrencyRequest, LoginInfo, LoginStatus } from '../../interfaces/modals';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginSuccess, logout, setEmail, setOTPAttemptsRemaining } from '../../redux/features/auth';
import { UserPortalView } from '../../components/user.portal/SideBar';
import { RootState } from '@/redux/store/store';

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
            const response = await api.post(`user/auth/subscriptions/subscribe`, body);
            console.log(response.data)
            if (response.data.success) {
                if (planName === PlanType.STARTER) {
                    navigate('/currency', { state: { email:response.data.data.object.email } });
                } else {
                    navigate(`/subscriptions/${response.data.data.object._id}/payment`);
                }
            }
        } catch (error) {
            processError(error);
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

    async function login(body: LoginInfo) {
        try {
            const response = await api.post(`user/auth/login`, body, { withCredentials: true });
            console.log(response.data)
            if (response.data.success) {
                const spacesInfo: any[] = response.data.data.object.spaces
                const spaces: {id: string, name: string, type: String}[] = []
                let defaultSpaceId:String = ""
                let defaultSpaceType:String = ""
                spacesInfo.forEach((s) => {
                    if (s.isDefault) {
                        defaultSpaceId = s._id
                        defaultSpaceType = s.type
                    }
                    spaces.push({id: s._id, name: s.name, type: s.type})
                })
                const userData = {
                    username: response.data.data.object.username,
                    email: response.data.data.object.email,
                    token: response.data.data.object.accessToken,
                    currency: response.data.data.object.currency,
                    plan: response.data.data.object.plan,
                    role: response.data.data.object.role,
                    spaces: spaces
                }
                dispatch(loginSuccess(userData))
                console.log(spaces)
                toast.success("Login successful!");
                navigate(`/user-portal/${defaultSpaceType.toLowerCase().split("_").join("-")}/${defaultSpaceId}/${UserPortalView.DASHBOARD}`);
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

    async function loginWithGoogle(body: {token: string, currency: string}) {
        try {
            const response = await api.post(`user/auth/google`, body, { withCredentials: true });
            console.log(response.data)
            if (response.data.success) {
                const spacesInfo: any = response.data.data.object.spaces
                const spaces: {id: string, name: string, type: String}[] = []
                let defaultSpaceId:String = ""
                let defaultSpaceType:String = ""
                spacesInfo.forEach((s: any) => {
                    if (s.isDefault) {
                        defaultSpaceId = s._id
                        defaultSpaceType = s.type
                    }
                    spaces.push({id: s._id, name: s.name, type: s.type})
                })
                const userData = {
                    username: response.data.data.object.username,
                    email: response.data.data.object.email,
                    token: response.data.data.object.accessToken,
                    currency: response.data.data.object.currency,
                    plan: response.data.data.object.plan,
                    role: response.data.data.object.role,
                    spaces: spaces
                }
                dispatch(loginSuccess(userData))
                toast.success("Login successful!");
                navigate(`/user-portal/${defaultSpaceType.toLowerCase().split("_").join("-")}/${defaultSpaceId}/${UserPortalView.DASHBOARD}`);
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

    return { register, sendOTP, verifyOTP, getAllPlans, subscribePlan, updateCurrency, login, loginWithGoogle, protectedRoute, logOut };
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

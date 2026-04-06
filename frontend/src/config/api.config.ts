import axios from 'axios';
import { logout, setIsAuthenticated, loginSuccess } from '../redux/features/auth';
import store from '../redux/store/store'; // Import your Redux store
import { toast } from 'react-toastify';

export const API_BASE_URL = import.meta.env.VITE_API_GATEWAY_BASE_URL || "http://localhost:8085/";

export const API_CONFIG = {
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
};

export const api = axios.create(API_CONFIG);

export const INTERNAL_SERVER_ERROR = "Internal server error!"

api.interceptors.response.use(
    response => response,
    async (error) => {

        const dispatch = store.dispatch;
        if (error?.response?.status === 403) { // Token expired
            console.log(">>> intercepter: Token expired or not found")
            dispatch(setIsAuthenticated({ isAuthenticated: false }));
            await refreshAccessToken(); // Attempt token refresh
            const authState = store.getState().auth;
            console.log(">>>> refresh token finished: ", authState)
            if (authState.isAuthenticated) {
                error.config.headers['Authorization'] = `Bearer ${authState.token}`;
                return axios(error.config); // Retry the request
            } else {
                toast.error(INTERNAL_SERVER_ERROR)
                console.log("Not authenticated. error while getting access token via refresh token....")
            }
            return
        }
        return Promise.reject(error);
    }
);

export const refreshAccessToken = async () => {
    const dispatch = store.dispatch;

    try {
        console.log(">>>> Requesting refresh token");

        // Send current theme to backend
        const currentTheme = localStorage.getItem('theme') || 'dark';

        const payload = {
            theme: currentTheme
        };

        const response = await api.post(
            `user/auth/refresh_token`,
            payload,
            { withCredentials: true }
        );

        if (response.data.success) {
            const userObject = response.data.data.object;   // ← Define it once here

            const userData = {
                username: userObject.username,
                email: userObject.email,
                token: userObject.accessToken,
                currency: userObject.currency,
                plan: userObject.plan,
                profileImgUrl: userObject.profileImgUrl,
                role: userObject.role,
                spaces: userObject.spaces,
                theme: userObject.theme || currentTheme   // Safe fallback
            };

            dispatch(loginSuccess(userData));

            // Sync theme back to localStorage (prevents erasure on refresh)
            if (userObject.theme) {
                localStorage.setItem('theme', userObject.theme);
            }

            console.log(">>> Refresh token successful with theme:", userObject.theme || currentTheme);
        }
    } catch (error: any) {
        console.error(">>> Refresh token failed:", error);
        dispatch(logout());
        window.location.href = '/login';
        toast.info("Your session has expired. Please login.");
    }
};




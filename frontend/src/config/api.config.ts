import axios from 'axios';
import { logout, setIsAuthenticated, loginSuccess } from '../redux/features/auth';
import store from '../redux/store/store';
import { toast } from 'react-toastify';

export const API_BASE_URL = import.meta.env.VITE_API_GATEWAY_BASE_URL || "http://localhost:8085/";

export const API_CONFIG = {
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
};

export const api = axios.create(API_CONFIG);

// Separate axios instance for refreshing token to avoid interceptor recursion
const refreshApi = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
});

export const INTERNAL_SERVER_ERROR = "Internal server error!"

api.interceptors.response.use(
    response => response,
    async (error) => {
        const originalRequest = error.config;
        const dispatch = store.dispatch;

        // If error is 403 and hasn't been retried yet
        if (error?.response?.status === 403 && !originalRequest._retry) {
            originalRequest._retry = true;
            console.log(">>> interceptor: Token expired or not found, attempting refresh...");

            try {
                const refreshedData = await refreshAccessToken();
                if (refreshedData) {
                    // Update headers for the retried request
                    // Use both cases to be safe with mixed service implementations
                    originalRequest.headers['Authorization'] = `Bearer ${refreshedData.token}`;
                    originalRequest.headers['authorization'] = `Bearer ${refreshedData.token}`;

                    return axios(originalRequest);
                }
            } catch (refreshError) {
                console.error("Critical: Token refresh failed", refreshError);
                dispatch(logout());
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export const refreshAccessToken = async () => {
    const dispatch = store.dispatch;
    try {
        console.log(">>>> Requesting refresh token");
        const response = await refreshApi.post(`user/auth/refresh_token`, {});

        if (response.data.success) {
            const userData = {
                userId: response.data.data.object._id,
                username: response.data.data.object.username,
                email: response.data.data.object.email,
                token: response.data.data.object.accessToken,
                currency: response.data.data.object.currency,
                plan: response.data.data.object.plan,
                profileImgUrl: response.data.data.object.profileImgUrl,
                role: response.data.data.object.role,
                spaces: response.data.data.object.spaces
            };

            dispatch(loginSuccess(userData));
            return userData;
        }
        return null;
    } catch (error) {
        console.log(">>> Refresh token expired or failed. navigating to login: ", error);
        dispatch(logout());
        window.location.href = '/login';
        toast.info("Your session has expired. Please login.");
        throw error;
    }
};





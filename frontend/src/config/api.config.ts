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

api.interceptors.request.use(
    (config) => {
        const token = store.getState().auth.token || localStorage.getItem("smart-wallet-token");
        if (token) {
            config.headers["Authorization"] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export const INTERNAL_SERVER_ERROR = "Internal server error!"

let isRefreshing = false;
let refreshQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
    refreshQueue.forEach((prom: any) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    refreshQueue = [];
};

api.interceptors.response.use(
    response => response,
    async (error) => {
        const originalRequest = error.config;
        const dispatch = store.dispatch;

        if (error?.response?.status === 403 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    refreshQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest._retry = true;
                        originalRequest.headers['Authorization'] = `Bearer ${token}`;
                        return api(originalRequest);
                    })
                    .catch((err) => {
                        return Promise.reject(err);
                    });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            return new Promise(async (resolve, reject) => {
                try {
                    console.log(">>> intercepter: Initializing single refresh token call");
                    await refreshAccessToken();
                    
                    const updatedState = store.getState().auth;
                    const newToken = updatedState.token;

                    if (updatedState.isAuthenticated && newToken) {
                        processQueue(null, newToken);
                        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
                        resolve(api(originalRequest));
                    } else {
                        throw new Error("Refresh failed to authenticate");
                    }
                } catch (refreshErr) {
                    processQueue(refreshErr, null);
                    dispatch(logout());
                    reject(refreshErr);
                } finally {
                    isRefreshing = false;
                }
            });
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

        const response = await axios.post(
            `${API_BASE_URL}user/auth/refresh_token`,
            payload,
            { withCredentials: true }
        );

        if (response.data.success) {
            const userObject = response.data.data.object;   // ← Define it once here

            const userData = {
                id: userObject.id || userObject._id,
                username: userObject.username,
                email: userObject.email,
                token: userObject.accessToken,
                currency: userObject.currency,
                plan: userObject.plan,
                subscriptionId: userObject.subscriptionId,
                profileImgUrl: userObject.profileImgUrl,
                role: userObject.role,
                spaces: userObject.spaces,
                theme: userObject.theme || currentTheme   // Safe fallback
            };

            // Sync token and theme back to localStorage
            if (userObject.accessToken) {
                localStorage.setItem("smart-wallet-token", userObject.accessToken);
            }
            if (userObject.theme) {
                localStorage.setItem('theme', userObject.theme);
            }

            // CRITICAL: Update Redux state so the interceptor retry uses the new token
            dispatch(loginSuccess(userData));

            console.log(">>> Refresh token successful with theme:", userObject.theme || currentTheme);
        }
    } catch (error: any) {
        console.error(">>> Refresh token failed:", error);
        dispatch(logout());
        window.location.href = '/login';
        toast.info("Your session has expired. Please login.");
    }
};




import axios from 'axios';
import { api } from '../config/api.config';
import { toast } from 'react-toastify';
import { useDispatch } from 'react-redux';
import { updateUser } from '../redux/features/auth';

export function UserService() {
    const dispatch = useDispatch();

    async function getMe() {
        try {
            const response = await api.get(`user/settings/me`);
            if (response.data.success) {
                return response.data.data.object;
            }
        } catch (error) {
            processError(error);
        }
        return null;
    }

    async function updateProfile(body: { currency?: string, theme?: string, profileImgUrl?: string }) {
        try {
            const response = await api.put(`user/settings/update-profile`, body);
            if (response.data.success) {
                toast.success(response.data.data.message || "Profile updated successfully!");
                
                // Update Redux state with new profile info
                const updatedUser = response.data.data.object;
                dispatch(updateUser({
                    username: updatedUser.username,
                    email: updatedUser.email,
                    currency: response.data.data.object.currency,
                    plan: response.data.data.object.plan,
                    profileImgUrl: response.data.data.object.profileImgUrl,
                    role: response.data.data.object.role,
                    theme: response.data.data.object.theme,
                    spaces: response.data.data.object.spaces
                }));
                return true;
            }
        } catch (error) {
            processError(error);
        }
        return false;
    }

    async function changePassword(body: { currentPassword: string, newPassword: string }) {
        try {
            const response = await api.put(`user/settings/change-password`, body);
            if (response.data.success) {
                toast.success(response.data.data.message || "Password changed successfully!");
                return true;
            }
        } catch (error) {
            processError(error);
        }
        return false;
    }

    return { getMe, updateProfile, changePassword };
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

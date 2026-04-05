import { userServiceApi } from '../config/api';

export interface UserContext {
    email: string;
    preferences: any[];
}

export async function getUserContext(userId: string): Promise<UserContext | null> {
    try {
        const response = await userServiceApi.get(`/settings/context/${userId}`);
        if (response.data && response.data.success) {
            return response.data.data.object;
        }
        return null;
    } catch (error) {
        console.error(`Error fetching user context for ${userId}:`, error);
        return null;
    }
}

import { api } from '../config/api';

export async function updateScheduleMemberStatus(spaceId: string, userId: string, status: string): Promise<boolean> {
    try {
        const body = {
            memberStatus: status
        };
        const response = await api.post(`finops/schedule/spaces/${spaceId}/members/${userId}/status`, body);
        return response.data.success;
    } catch (error) {
        return false
    }
}

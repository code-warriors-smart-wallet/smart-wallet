import { api } from '../config/api';

export async function updateTransactionMemberStatus(spaceId: string, userId: string, status: string): Promise<boolean> {
    try {
        const body = {
            memberStatus: status
        };
        const response = await api.post(`finops/transaction/spaces/${spaceId}/members/${userId}/status`, body);
        return response.data.success;
    } catch (error) {
        return false
    }
}

// import { api } from '../config/api';
// import { MemberStatus } from '../models/transaction';

// export async function updateTransactionMemberStatus(spaceId: string, userId: string, status: MemberStatus): Promise<boolean> {
//     try {
//         const body = {
//             memberStatus: status
//         };
//         const response = await api.post(`finops/transaction/spaces/${spaceId}/members/${userId}/status`, body);
//         return response.data.success;
//     } catch (error) {
//         return false
//     }
// }

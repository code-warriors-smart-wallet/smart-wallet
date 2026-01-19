import axios from 'axios';
import { api } from '../config/api.config';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store/store';
import { SpaceType } from '../components/user.portal/views/Spaces';

export function DashboardService() {
    const token = useSelector((state: RootState) => state.auth.token)

    async function getCashBankSummary(spacetype: SpaceType, spaceid: string, from: string, to: string): Promise<any> {
        try {
            let response = null
            if (spacetype == SpaceType.CASH || spacetype === SpaceType.BANK) {
                response = await api.get(`report/dashboard/cash/${spaceid}/${from}/${to}`, {
                    headers: {
                        "authorization": `Bearer ${token}`
                    }
                });
            }
            console.log("dash", response?.data)
            if (response?.data.success) {
                return response?.data.data.object
            }
            return []
        } catch (error) {
            processError(error)
            return []
        }
    }

    async function getOtherSpaceSummary(spacetype: string, spaceid: string): Promise<any> {
        try {
            let response = null
            response = await api.get(`report/dashboard/${spacetype}/${spaceid}`, {
                headers: {
                    "authorization": `Bearer ${token}`
                }
            });
            console.log("dash", response?.data)
            if (response?.data.success) {
                return response?.data.data.object
            }
            return []
        } catch (error) {
            processError(error)
            return []
        }
    }

    async function getAllSpaceSummary(): Promise<any> {
        try {
            let response = null
            response = await api.get(`report/dashboard/all`, {
                headers: {
                    "authorization": `Bearer ${token}`
                }
            });
            console.log("dash", response?.data)
            if (response?.data.success) {
                return response?.data.data.object
            }
            return []
        } catch (error) {
            processError(error)
            return []
        }
    }

    return { getCashBankSummary, getOtherSpaceSummary, getAllSpaceSummary };
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

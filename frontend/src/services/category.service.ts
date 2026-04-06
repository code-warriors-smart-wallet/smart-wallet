import axios from 'axios';
import { api } from '../config/api.config';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store/store';
import { CategoryInfo } from '../interfaces/modals';

export function CategoryService() {
    const token = useSelector((state: RootState) => state.auth.token)

    async function getCategories(spaceType?: string): Promise<any[]> {
        try {
            const response = await api.get(`finops/category`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            if (response.data.success) {
                return response.data.data.object
            }
            return []
        } catch (error) {
            processError(error)
            return []
        }
    }

    async function getCategoriesBySpace(spaceid: string): Promise<any[]> {
        try {
            const response = await api.get(`finops/category/space/${spaceid}`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            console.log(response.data.data.object)
            if (response.data.success) {
                return response.data.data.object
            }
            return []
        } catch (error) {
            processError(error)
            return []
        }
    }

    async function createSubCategory(body: any): Promise<void> {
        try {
            const response = await api.post(`finops/category/sub`, body, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            if (response.data.success) {
                console.log(response.data)
                toast.success(response.data.data.message)
            }
        } catch (error) {
            processError(error)
        }
    }

    async function updateSubCategory(body: any): Promise<void> {
        try {
            const response = await api.put(`finops/category/sub`, body, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            if (response.data.success) {
                console.log(response.data)
                toast.success(response.data.data.message)
            }
        } catch (error) {
            processError(error)
        }
    }

    async function deleteSubCategory(pid: string, sid: string): Promise<void> {
        try {
            const response = await api.delete(`finops/category/sub/${pid}/${sid}`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            if (response.data.success) {
                console.log(response.data)
                toast.success(response.data.data.message)
            }
        } catch (error) {
            processError(error)
        }
    }

    async function createMainCategory(body: any): Promise<void> {
        try {
            const response = await api.post(`finops/category/main`, body, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            if (response.data.success) {
                console.log(response.data)
                toast.success(response.data.data.message)
            }
        } catch (error) {
            processError(error)
        }
    }

    return { getCategories, getCategoriesBySpace, createSubCategory, updateSubCategory, deleteSubCategory, createMainCategory };
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

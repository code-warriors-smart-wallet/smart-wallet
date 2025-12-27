import axios from 'axios';
import { api } from '../config/api.config';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import {ScheduleInfo} from "../interfaces/modals";
import { RootState } from '@/redux/store/store';

export function ScheduleService() {
    const token = useSelector((state: RootState) => state.auth.token)

    async function createSchedule(body: ScheduleInfo): Promise<any> {
        try {
            console.log(body)
            const response = await api.post(`finops/schedule/`, body, {
                headers: {
                    "authorization": `Bearer ${token}`
                }
            });
            if (response.data.success) {
                console.log(response.data.data)
                toast.success(response.data.data.message)
            }
        } catch (error) {
            processError(error)
        }
    }

    async function confirmSchedule(id: string): Promise<any> {
        try {
            console.log(token)
            const response = await api.put(`finops/schedule/confirm/${id}`, {
                headers: {
                    "authorization": `Bearer ${token}`
                }
            });
            if (response.data.success) {
                console.log(response.data.data)
                toast.success(response.data.data.message)
            }
        } catch (error) {
            processError(error)
        }
    }

    async function skipSchedule(id: string): Promise<any> {
        try {
            const response = await api.put(`finops/schedule/skip/${id}`, {
                headers: {
                    "authorization": `Bearer ${token}`
                }
            });
            if (response.data.success) {
                console.log(response.data.data)
                toast.success(response.data.data.message)
            }
        } catch (error) {
            processError(error)
        }
    }

    async function editSchedule(id: string, body: ScheduleInfo): Promise<any> {
        try {
            console.log(body)
            const response = await api.put(`finops/schedule/${id}`, body, {
                headers: {
                    "authorization": `Bearer ${token}`
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


    async function deleteSchedule(id: string): Promise<any> {
        try {
            const response = await api.delete(`finops/schedule/${id}`, {
                headers: {
                    "authorization": `Bearer ${token}`
                }
            });
            if (response.data.success) {
                console.log(response.data)
                toast.success(response.data.message)
            }
        } catch (error) {
            processError(error)
        }
    }

    async function getSchedulesByUser(spaceid: string, limit: number, skip: number): Promise<any> {
        try {
            const response = await api.get(`finops/schedule/user/${spaceid}/${limit}/${skip}`, {
                headers: {
                    "authorization": `Bearer ${token}`
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

    return { createSchedule, editSchedule, deleteSchedule, getSchedulesByUser, confirmSchedule, skipSchedule };
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

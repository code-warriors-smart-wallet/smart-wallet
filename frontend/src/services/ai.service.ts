import axios from 'axios';
import { api } from '../config/api.config';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store/store';

interface ChatMessage {
    role: 'user' | 'model';
    parts: string;
}

interface ChatResponse {
    response: string;
    role: string;
}

export function AIService() {
    const token = useSelector((state: RootState) => state.auth.token);

    async function sendMessage(message: string, history: ChatMessage[]): Promise<ChatResponse | null> {
        try {
            const response = await api.post('ai/chat/chat', {
                message,
                history
            }, {
                headers: {
                    "authorization": `Bearer ${token}`
                }
            });

            if (response?.data.success) {
                return response.data.data.object;
            }
            return null;
        } catch (error) {
            processError(error);
            return null;
        }
    }

    async function getSuggestions(): Promise<string[]> {
        try {
            const response = await api.get('ai/chat/suggestions', {
                headers: {
                    "authorization": `Bearer ${token}`
                }
            });

            if (response?.data.success) {
                return response.data.data.object;
            }
            return [];
        } catch (error) {
            console.error("Error fetching suggestions:", error);
            return [];
        }
    }

    return { sendMessage, getSuggestions };
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

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export const userServiceApi = axios.create({
    baseURL: process.env.USER_SERVICE_URL || 'http://localhost:8081',
    withCredentials: true,
});

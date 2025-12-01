import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
    baseURL: API_URL,
});

// Add request interceptor to include auth token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export const ingestFiles = async (files, threadId = null) => {
    const formData = new FormData();
    Array.from(files).forEach((file) => {
        formData.append('files', file);
    });
    if (threadId) {
        formData.append('thread_id', threadId);
    }
    const response = await api.post('/ingest', formData);
    return response.data;
};

export const queryChat = async (question, history = []) => {
    const response = await api.post('/query', { question, history });
    return response.data;
};

export const extractDoorSchedule = async () => {
    const response = await api.post('/extract/door-schedule');
    return response.data;
};

export const runEvals = async () => {
    const response = await api.post('/eval/run-tests');
    return response.data;
};

export const checkHealth = async () => {
    const response = await api.get('/health');
    return response.data;
};

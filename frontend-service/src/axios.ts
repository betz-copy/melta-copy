import axiosInstance, { AxiosHeaders } from 'axios';
import { StatusCodes } from 'http-status-codes';
import { environment } from './globals';
import { AuthService } from './services/authService';
import { useWorkspaceStore } from './stores/workspace';

const axios = axiosInstance.create({
    withCredentials: true,
    timeout: 1800000,
    baseURL: '/api',
});

axios.interceptors.request.use((config) => {
    const { workspace } = useWorkspaceStore.getState();

    if (!config.headers) config.headers = new AxiosHeaders();
    config.headers[environment.workspaceIdHeaderName] = workspace._id;

    return config;
});

axios.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === StatusCodes.UNAUTHORIZED) {
            AuthService.logout();
        }

        return Promise.reject(error);
    },
);

export default axios;

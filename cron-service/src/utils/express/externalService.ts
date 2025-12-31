import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import config from '../../config';

const {
    service: { workspaceIdHeaderName },
} = config;

export default abstract class DefaultExternalServiceApi<T = unknown> {
    public api: AxiosInstance;

    constructor(workspaceId: string, axiosConfig?: AxiosRequestConfig<T>) {
        this.api = axios.create(axiosConfig);
        // Add the workspace id header to axios requests
        this.api.defaults.headers[workspaceIdHeaderName] = workspaceId;
    }
}

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import config from '../../config';

const { workspaceIdHeaderName } = config.service;

export default abstract class DefaultExternalServiceApi {
    public api: AxiosInstance;

    constructor(workspaceId: string, axiosConfig?: AxiosRequestConfig<unknown> | undefined) {
        this.api = axios.create(axiosConfig);
        // Add the workspace id header to axios requests
        this.api.defaults.headers[workspaceIdHeaderName] = workspaceId;
    }
}

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import config from '../../config';

const {
    service: { workspaceIdHeaderName },
} = config;

export default abstract class DefaultExternalServiceApi {
    public api: AxiosInstance;

    constructor(workspaceId: string, axiosConfig?: AxiosRequestConfig<unknown>) {
        // Add the workspace id header to axios requests
        this.api = axios.create({ ...axiosConfig, headers: { [workspaceIdHeaderName]: workspaceId } });
    }
}

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import config from '../../config';

const {
    service: { dbHeaderName },
} = config;

export default abstract class DefaultExternalServiceApi {
    public api: AxiosInstance;

    constructor(workspaceId: string, axiosConfig?: AxiosRequestConfig<any> | undefined) {
        this.api = axios.create(axiosConfig);
        // Add the database header to axios requests
        this.api.defaults.headers[dbHeaderName] = workspaceId;
    }
}

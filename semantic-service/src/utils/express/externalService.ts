import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

export default abstract class DefaultExternalServiceApi {
    public api: AxiosInstance;

    constructor(axiosConfig?: AxiosRequestConfig<any> | undefined) {
        this.api = axios.create(axiosConfig);
    }
}

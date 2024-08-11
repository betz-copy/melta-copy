import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import config from '../../config';

const {
    service: { dbHeaderName },
} = config;

export default abstract class DefaultExternalServiceApi {
    public api: AxiosInstance;

    constructor(dbName: string, axiosConfig?: AxiosRequestConfig<any>) {
        // Add the database header to axios requests
        this.api = axios.create({ ...axiosConfig, headers: { [dbHeaderName]: dbName } });
    }
}

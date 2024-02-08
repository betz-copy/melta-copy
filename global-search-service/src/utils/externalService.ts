import { AxiosInstance } from 'axios';
import config from '../config';

const {
    service: { dbHeaderName },
} = config;

export default abstract class DefaultExternalService {
    public api: AxiosInstance;

    constructor(dbName: string, axiosInstance: AxiosInstance) {
        this.api = axiosInstance;
        // Add the database header to axios requests
        this.api.defaults.headers[dbHeaderName] = dbName;
    }
}

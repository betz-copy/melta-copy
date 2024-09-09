import { AxiosInstance } from 'axios';
import config from '../config';

const {
    service: { workspaceIdHeaderName },
} = config;

export default abstract class DefaultExternalService {
    public api: AxiosInstance;

    constructor(workspaceId: string, axiosInstance: AxiosInstance) {
        this.api = axiosInstance;
        // Add the workspace id header to axios requests
        this.api.defaults.headers[workspaceIdHeaderName] = workspaceId;
    }
}

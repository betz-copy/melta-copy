import axios from 'axios';
import config from '../config';

const createAxiosInstance = (workspaceId: string) =>
    axios.create({
        headers: {
            [config.service.workspaceIdHeaderName]: workspaceId,
        },
    });

export default createAxiosInstance;

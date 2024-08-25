import axios from 'axios';
import config from '../config';

export const createAxiosInstance = (workspaceId: string) =>
    axios.create({
        headers: {
            [config.service.workspaceIdHeaderName]: workspaceId,
        },
    });

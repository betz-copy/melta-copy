import axios from 'axios';
import axiosInstance from '../axios';
import { environment } from '../globals';

export type ApiUrl = `/api/files/${string}`;

export const apiUrlToImageSource = async (url: ApiUrl, workspaceId?: string) => {
    const { data } = await (workspaceId ? axios : axiosInstance).get(url, {
        baseURL: '',
        responseType: 'blob',
        ...(workspaceId ? { headers: { [environment.workspaceIdHeaderName]: workspaceId } } : {}),
    });
    return URL.createObjectURL(data);
};

import { ICreateProcessTemplateBody, IMongoProcessTemplatePopulated } from '@packages/process';
import axios from 'axios';
import config from './config';
import { tryCatch } from './utils';
import createAxiosInstance from './utils/axios';

const { url, createProcessTemplateRoute, isAliveRoute } = config.processService;

export const createProcessTemplates = async (workspaceId: string, processTemplates: ICreateProcessTemplateBody[]) => {
    const axiosInstance = createAxiosInstance(workspaceId);

    const promises = processTemplates.map((processTemplate) => {
        return axiosInstance.post<IMongoProcessTemplatePopulated>(url + createProcessTemplateRoute, processTemplate);
    });

    const results = await Promise.all(promises);
    return results.map((result) => result.data);
};

export const isProcessServiceAlive = async () => {
    const { result, err } = await tryCatch(() => axios.get(url + isAliveRoute));

    return { result, err };
};

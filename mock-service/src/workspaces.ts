import axios from 'axios';
import { IWorkspace } from '@microservices/shared';
import config from './config';
import { trycatch } from './utils';

const { url, baseRoute, isAliveRoute } = config.workspacesService;

export const createWorkspace = async (workspace: Omit<IWorkspace, '_id'>) => {
    const { data } = await axios.post<IWorkspace>(`${url}${baseRoute}`, workspace);
    return data;
};

export const createWorkspaces = async (workspaces: Omit<IWorkspace, '_id'>[]) => {
    let mainWorkspace: IWorkspace;

    // eslint-disable-next-line no-restricted-syntax
    for (const workspace of workspaces) {
        // eslint-disable-next-line no-await-in-loop
        mainWorkspace = await createWorkspace(workspace);
    }

    return mainWorkspace!;
};

export const getRootWorkspace = async () => {
    const { data } = await axios.post<IWorkspace>(`${url}${baseRoute}/file`, { path: '/' });
    return data;
};

export const getWorkspaces = async () => {
    const { data } = await axios.post<IWorkspace[]>(`${url}${baseRoute}/dir`, { path: '/' });
    return data;
};

export const isWorkpacesServiceAlive = async () => {
    const { result, err } = await trycatch(() => axios.get(url + isAliveRoute));

    return { result, err };
};

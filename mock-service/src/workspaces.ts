import { IMetadata, IWorkspace } from '@microservices/shared';
import axios from 'axios';
import config from './config';
import { trycatch } from './utils';

const { url, baseRoute, isAliveRoute } = config.workspacesService;

export const createWorkspace = async (workspace: Omit<IWorkspace, '_id'>) => {
    const { data } = await axios.post<IWorkspace>(`${url}${baseRoute}`, workspace);
    return data;
};

export const createWorkspaces = async (workspaces: Omit<IWorkspace, '_id'>[]) => {
    const mainWorkspaces: IWorkspace[] = [];

    // eslint-disable-next-line no-restricted-syntax
    for (const workspace of workspaces) {
        // eslint-disable-next-line no-await-in-loop
        const mainWorkspace = await createWorkspace(workspace);
        mainWorkspaces.push(mainWorkspace);
    }

    return mainWorkspaces;
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

export const updateWorkspaceMetadata = async (workspaceId: string, metadata: Partial<IMetadata>) => {
    const { data } = await axios.patch(`${url}${baseRoute}/${workspaceId}/metadata`, { ...metadata });
    return data;
};

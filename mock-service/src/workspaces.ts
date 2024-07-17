import axios from 'axios';
import config from './config';
import { IWorkspace } from './interfaces/workspaces';
import { trycatch } from './utils';

const { url, baseRoute, isAliveRoute } = config.workspacesService;

export const createWorkspace = async (workspace: Omit<IWorkspace, '_id'>) => {
    const { data } = await axios.post<IWorkspace>(`${url}${baseRoute}`, workspace);
    return data;
};

export const createWorkspaces = async (workspaces: Omit<IWorkspace, '_id'>[]) => {
    const [_, mainWorkspace] = await Promise.all(workspaces.map(createWorkspace));
    return mainWorkspace;
};

export const getWorkspaces = async () => {
    const { data } = await axios.get<IWorkspace[]>(`${url}${baseRoute}`);
    return data;
};

export const isWorkpacesServiceAlive = async () => {
    const { result, err } = await trycatch(() => axios.get(url + isAliveRoute));

    return { result, err };
};

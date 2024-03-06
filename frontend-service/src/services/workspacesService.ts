import axios from '../axios';
import { environment } from '../globals';
import { IWorkspace } from '../interfaces/workspaces';

const {
    api: { workspaces },
} = environment;

export const getDir = async (path: IWorkspace['path']) => {
    const { data } = await axios.post<IWorkspace[]>(`${workspaces}/dir`, { path });
    return data;
};

export const getFile = async (path: IWorkspace['path']) => {
    const { data } = await axios.post<IWorkspace>(`${workspaces}/file`, { path });
    return data;
};

export const getById = async (id: string) => {
    const { data } = await axios.get<IWorkspace>(`${workspaces}/${id}`);
    return data;
};

export const createOne = async (workspace: Omit<IWorkspace, '_id'>) => {
    const { data } = await axios.post<IWorkspace>(`${workspaces}/`, workspace);
    return data;
};

export const updateOne = async (id: string, workspace: Omit<IWorkspace, '_id'>) => {
    const { data } = await axios.put<IWorkspace>(`${workspaces}/${id}`, workspace);
    return data;
};

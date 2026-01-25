import { IWorkspace } from '@packages/workspace';
import axios from 'axios';
import config from '../../config';

const { url, baseRoute, requestTimeout } = config.workspaceService;

class WorkspaceService {
    private static api = axios.create({ baseURL: `${url}${baseRoute}`, timeout: requestTimeout });

    static async getWorkspaceIds(type: IWorkspace['type']) {
        const { data } = await WorkspaceService.api.post<string[]>(`/ids`, { type });
        return data;
    }

    static async getWorkspaceHierarchyIds(id: string) {
        const { data } = await WorkspaceService.api.get<string[]>(`/${id}/ids/hierarchy`);
        return data;
    }

    static async getDir(path: IWorkspace['path']) {
        const { data } = await WorkspaceService.api.post<IWorkspace[]>('/dir', { path });
        return data;
    }

    static async getFile(path: IWorkspace['path']) {
        const { data } = await WorkspaceService.api.post<IWorkspace>('/file', { path });
        return data;
    }

    static async getById(id: string) {
        const { data } = await WorkspaceService.api.get<IWorkspace>(`/${id}`);
        return data;
    }

    static async createOne(workspace: Omit<IWorkspace, '_id'>) {
        const { data } = await WorkspaceService.api.post<IWorkspace & { createdAt: Date; updatedAt: Date }>('/', workspace);
        return data;
    }

    static async updateOne(id: string, workspace: Omit<IWorkspace, '_id'>) {
        const { data } = await WorkspaceService.api.put<IWorkspace>(`/${id}`, workspace);
        return data;
    }

    static async deleteOne(id: string) {
        const { data } = await WorkspaceService.api.delete<IWorkspace>(`/${id}`);
        return data;
    }

    static async getWorkspaces(body: { search: string }) {
        const { data } = await WorkspaceService.api.post<IWorkspace[]>('/search', body);
        return data;
    }
}

export default WorkspaceService;

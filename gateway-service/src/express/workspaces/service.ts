import axios from 'axios';
import { IWorkspace } from '@microservices/shared';
import config from '../../config';

const {
    workspaceService: { url, baseRoute, requestTimeout },
} = config;

class WorkspaceService {
    private static api = axios.create({ baseURL: `${url}${baseRoute}`, timeout: requestTimeout });

    static async getWorkspaceIds(type: IWorkspace['type']) {
        const { data } = await this.api.post<string[]>(`/ids`, { type });
        return data;
    }

    static async getWorkspaceHierarchyIds(id: string) {
        const { data } = await this.api.get<string[]>(`/${id}/ids/hierarchy`);
        return data;
    }

    static async getDir(path: IWorkspace['path']) {
        const { data } = await this.api.post<IWorkspace[]>('/dir', { path });
        return data;
    }

    static async getFile(path: IWorkspace['path']) {
        const { data } = await this.api.post<IWorkspace>('/file', { path });
        return data;
    }

    static async getById(id: string) {
        const { data } = await this.api.get<IWorkspace>(`/${id}`);
        return data;
    }

    static async createOne(workspace: Omit<IWorkspace, '_id'>) {
        const { data } = await this.api.post<IWorkspace & { createdAt: Date; updatedAt: Date }>('/', workspace);
        return data;
    }

    static async updateOne(id: string, workspace: Omit<IWorkspace, '_id'>) {
        const { data } = await this.api.put<IWorkspace>(`/${id}`, workspace);
        return data;
    }

    static async deleteOne(id: string) {
        const { data } = await this.api.delete<IWorkspace>(`/${id}`);
        return data;
    }

    static async getWorkspaces(body: { search: string }) {
        const { data } = await this.api.post<IWorkspace[]>('/search', body);
        return data;
    }
}

export default WorkspaceService;

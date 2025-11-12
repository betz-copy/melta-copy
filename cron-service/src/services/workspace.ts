import { IWorkspace } from '@microservices/shared';
import axios from 'axios';
import config from '../config';

const {
    workspaceService: { url, baseRoute, requestTimeout },
} = config;

class WorkspaceService {
    private static api = axios.create({
        baseURL: `${url}${baseRoute}`,
        timeout: requestTimeout,
    });

    static async getWorkspaceIds(type: IWorkspace['type']) {
        const { data } = await WorkspaceService.api.post<string[]>(`/ids`, { type });
        return data;
    }

    static async getWorkspaceHierarchyIds(id: string) {
        const { data } = await WorkspaceService.api.get<string[]>(`/${id}/ids/hierarchy`);
        return data;
    }
}

export default WorkspaceService;

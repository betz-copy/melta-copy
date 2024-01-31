import axios from 'axios';
import config from '../../config';
import { IWorkspace } from './interface';

const {
    workspaceService: { url, baseRoute, requestTimeout },
} = config;

export class WorkspaceService {
    private static api = axios.create({ baseURL: `${url}${baseRoute}`, timeout: requestTimeout });

    static async getDir(path: IWorkspace['path']) {
        const { data } = await this.api.post('/dir', { path });
        return data;
    }

    static async getFile(path: IWorkspace['path']) {
        const { data } = await this.api.post('/file', { path });
        return data;
    }

    static async getTree(path: IWorkspace['path']) {
        const { data } = await this.api.post('/tree', { path });
        return data;
    }

    static async getById(id: string) {
        const { data } = await this.api.get(`/${id}`);
        return data;
    }

    static async createOne(workspace: Omit<IWorkspace, '_id'>) {
        const { data } = await this.api.post('/', workspace);
        return data;
    }

    static async updateOne(id: string, workspace: Omit<IWorkspace, '_id'>) {
        const { data } = await this.api.put(`/${id}`, workspace);
        return data;
    }

    static async deleteOne(id: string) {
        const { data } = await this.api.delete(`/${id}`);
        return data;
    }
}

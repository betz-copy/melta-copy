import { IWorkspace } from './interface';
import { WorkspaceService } from './service';

export class WorkspaceManager {
    static async getDir(path: IWorkspace['path']) {
        return WorkspaceService.getDir(path);
    }

    static async getFile(path: IWorkspace['path']) {
        return WorkspaceService.getFile(path);
    }

    static async getById(id: string) {
        return WorkspaceService.getById(id);
    }

    static async createOne(workspace: Omit<IWorkspace, '_id'>) {
        return WorkspaceService.createOne(workspace);
    }

    static async updateOne(id: string, workspace: Omit<IWorkspace, '_id'>) {
        return WorkspaceService.updateOne(id, workspace);
    }

    static async deleteOne(id: string) {
        return WorkspaceService.deleteOne(id);
    }
}

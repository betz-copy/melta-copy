import { IWorkspace } from './inteface';
import { WorkspaceService } from '../services/workspace';
import DefaultManagerProxy from '../utils/express/manager';

export class WorkspaceManager extends DefaultManagerProxy {
    static async getWorkspaceIds(type: IWorkspace['type']) {
        return WorkspaceService.getWorkspaceIds(type);
    }

    static async getWorkspaceHierarchyIds(id: string) {
        return WorkspaceService.getWorkspaceHierarchyIds(id);
    }
}

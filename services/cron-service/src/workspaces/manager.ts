import { IWorkspace } from '@microservices/shared';
import WorkspaceService from '../services/workspace';
import DefaultManagerProxy from '../utils/express/manager';

class WorkspaceManager extends DefaultManagerProxy {
    static async getWorkspaceIds(type: IWorkspace['type']) {
        return WorkspaceService.getWorkspaceIds(type);
    }

    static async getWorkspaceHierarchyIds(id: string) {
        return WorkspaceService.getWorkspaceHierarchyIds(id);
    }
}

export default WorkspaceManager;

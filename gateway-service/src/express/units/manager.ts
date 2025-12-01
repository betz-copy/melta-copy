import UserService from '../../externalServices/userService';

export class UnitsManager {
    static async getHierarchyByWorkspace(userId: string, workspaceId: string) {
        return UserService.getUnitHierarchy(workspaceId, userId);
    }
}

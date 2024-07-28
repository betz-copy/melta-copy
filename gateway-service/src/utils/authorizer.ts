import { Request } from 'express';
import { typedObjectEntries } from '.';
import { UserNotAuthorizedError } from '../express/error';
import { WorkspaceService } from '../express/workspaces/service';
import { UserService } from '../externalServices/userService';
import { PermissionScope, PermissionType } from '../externalServices/userService/interfaces/permissions';
import { ISubCompactPermissions } from '../externalServices/userService/interfaces/permissions/permissions';
import { wrapMiddleware } from './express';
import DefaultController from './express/controller';

export type RequestWithPermissionsOfUserId = Request & { permissionsOfUserId: ISubCompactPermissions };

export class Authorizer extends DefaultController {
    // private workspacePermissions: ISubCompactPermissions;

    constructor(private workspaceId: string, _userId: string) {
        super(null);

        // Authorizer.getWorkspacePermissions(workspaceId, userId).then((permissions) => {
        //     this.workspacePermissions = permissions;
        // });
    }

    // private static async getWorkspacePermissions(workspaceId: string, userId: string): Promise<ISubCompactPermissions> {
    //     const workspace = await WorkspaceService.getById(workspaceId);
    //
    //     const workspaceHierarchyIds = workspace.path.split('/');
    //     workspaceHierarchyIds.push(workspaceId);
    //
    //     const permissions = await UserService.getUserPermissions(userId, workspaceHierarchyIds);
    //
    //     const workspacePermissions: ISubCompactPermissions = {};
    //
    //     workspaceHierarchyIds.forEach((id) => {
    //         if (!permissions[id]) return;
    //         this.mergeSubCompactPermissions(workspacePermissions, permissions[id]);
    //     });
    //
    //     return workspacePermissions;
    // }
    //
    // private static mergeSubCompactPermissions(original: ISubCompactPermissions, addition: ISubCompactPermissions) {
    //     Object.keys(addition).forEach((permissionType) => {
    //         if (!original[permissionType]) {
    //             original[permissionType] = addition[permissionType];
    //             return;
    //         }
    //
    //         original[permissionType] = this.mergeCompactPermission(original[permissionType], addition[permissionType]);
    //     });
    // }
    //
    // private static mergeCompactPermission(original: ICompact<IPermission>, addition: ICompact<IPermission>): ICompact<IPermission> {
    //     if (original.scope === PermissionScope.write || addition.scope === PermissionScope.write) return { scope: PermissionScope.write };
    //     if (addition.scope) original.scope = addition.scope;
    //
    //     Object.keys(addition).forEach((subClass) => {
    //         if (subClass === 'scope') return;
    //         if (!original[subClass]) {
    //             original[subClass] = addition[subClass];
    //             return;
    //         }
    //
    //         Object.keys(addition[subClass]).forEach((id) => {
    //             if (!original[subClass][id]) {
    //                 original[subClass][id] = addition[subClass][id];
    //                 return;
    //             }
    //
    //             original[subClass][id] = this.mergeCompactPermission(original[subClass][id], addition[subClass][id]);
    //         });
    //     });
    //
    //     return original;
    // }

    private async authorizeUser(req: Request, userId: string, authPermissions: ISubCompactPermissions) {
        const workspace = await WorkspaceService.getById(this.workspaceId);

        const workspaceHierarchyIds = workspace.path.split('/');
        workspaceHierarchyIds.push(this.workspaceId);

        const userPermissions = await UserService.getUserPermissions(userId, workspaceHierarchyIds);

        typedObjectEntries(authPermissions).forEach(([type, _permission]) => {
            if (!userPermissions[this.workspaceId][type]) throw new UserNotAuthorizedError();
        });

        (req as RequestWithPermissionsOfUserId).permissionsOfUserId = userPermissions[this.workspaceId];
    }

    // private async authorizeCompactPermission(permission: ICompact<IPermission>, authPermission: ICompact<IPermission>) {}

    async userHasSomePermissions(req: Request) {
        const { [this.workspaceId]: userWorkspacePermissions } = await UserService.getUserPermissions(req.user!.id, [this.workspaceId]);
        if (!userWorkspacePermissions) throw new UserNotAuthorizedError();
        (req as RequestWithPermissionsOfUserId).permissionsOfUserId = userWorkspacePermissions;
    }

    private async wrapAuthMiddleware(authPermissions: ISubCompactPermissions) {
        return wrapMiddleware((req) => this.authorizeUser(req, req.user!.id, authPermissions));
    }

    async userCanWriteProcesses() {
        this.wrapAuthMiddleware({ [PermissionType.processes]: { scope: PermissionScope.write } });
    }

    async userCanReadProcesses() {
        this.wrapAuthMiddleware({ [PermissionType.processes]: { scope: PermissionScope.read } });
    }

    async userCanWriteTemplates() {
        this.wrapAuthMiddleware({ [PermissionType.templates]: { scope: PermissionScope.write } });
    }

    async userCanReadTemplates() {
        this.wrapAuthMiddleware({ [PermissionType.templates]: { scope: PermissionScope.read } });
    }

    async userCanWritePermissions() {
        this.wrapAuthMiddleware({ [PermissionType.permissions]: { scope: PermissionScope.write } });
    }

    async userCanReadPermissions() {
        this.wrapAuthMiddleware({ [PermissionType.permissions]: { scope: PermissionScope.read } });
    }

    async userCanWriteRules() {
        this.wrapAuthMiddleware({ [PermissionType.rules]: { scope: PermissionScope.write } });
    }

    async userCanReadRules() {
        this.wrapAuthMiddleware({ [PermissionType.rules]: { scope: PermissionScope.read } });
    }
}

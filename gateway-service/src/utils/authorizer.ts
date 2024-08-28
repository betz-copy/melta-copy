import { Request } from 'express';
import { typedObjectEntries } from '.';
import { UserIncorrectScopeError, UserNotAuthorizedError } from '../express/error';
import { WorkspaceService } from '../express/workspaces/service';
import { UserService } from '../externalServices/userService';
import { PermissionScope, PermissionType } from '../externalServices/userService/interfaces/permissions';
import { ISubCompactPermissions } from '../externalServices/userService/interfaces/permissions/permissions';
import { createWorkspacesController } from './express';
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

    async getWorkspacePermissions(userId: string) {
        const workspaceHierarchyIds = await WorkspaceService.getWorkspaceHierarchyIds(this.workspaceId);
        workspaceHierarchyIds.push(this.workspaceId);

        const userPermissions = await UserService.getUserPermissions(userId, workspaceHierarchyIds);

        if (!Object.keys(userPermissions)) throw new UserNotAuthorizedError();

        return userPermissions[this.workspaceId] || userPermissions[workspaceHierarchyIds[0]];
    }

    private async authorizeUser(req: Request, userId: string, authPermissions: ISubCompactPermissions) {
        const workspacePermissions = await this.getWorkspacePermissions(userId);

        typedObjectEntries(authPermissions).forEach(([type, permission]) => {
            const currentPermissions = workspacePermissions?.[type] || workspacePermissions?.admin;

            if (!currentPermissions) throw new UserNotAuthorizedError();

            if (currentPermissions.scope !== PermissionScope.write && currentPermissions.scope !== permission?.scope)
                throw new UserIncorrectScopeError(currentPermissions.scope, permission?.scope);
        });

        (req as RequestWithPermissionsOfUserId).permissionsOfUserId = workspacePermissions;
    }

    // private async authorizeCompactPermission(permission: ICompact<IPermission>, authPermission: ICompact<IPermission>) {}

    async userHasSomePermissions(req: Request) {
        (req as RequestWithPermissionsOfUserId).permissionsOfUserId = await this.getWorkspacePermissions(req.user!.id);
    }

    private async wrapAuthMiddleware(req: Request, authPermissions: ISubCompactPermissions) {
        return this.authorizeUser(req, req.user!.id, authPermissions);
    }

    async userCanWriteProcesses(req: Request) {
        await this.wrapAuthMiddleware(req, { [PermissionType.processes]: { scope: PermissionScope.write } });
    }

    async userCanReadProcesses(req: Request) {
        await this.wrapAuthMiddleware(req, { [PermissionType.processes]: { scope: PermissionScope.read } });
    }

    async userCanWriteTemplates(req: Request) {
        await this.wrapAuthMiddleware(req, { [PermissionType.templates]: { scope: PermissionScope.write } });
    }

    async userCanReadTemplates(req: Request) {
        await this.wrapAuthMiddleware(req, { [PermissionType.templates]: { scope: PermissionScope.read } });
    }

    async userCanWritePermissions(req: Request) {
        await this.wrapAuthMiddleware(req, { [PermissionType.permissions]: { scope: PermissionScope.write } });
    }

    async userCanReadPermissions(req: Request) {
        await this.wrapAuthMiddleware(req, { [PermissionType.permissions]: { scope: PermissionScope.read } });
    }

    async userCanWriteRules(req: Request) {
        await this.wrapAuthMiddleware(req, { [PermissionType.rules]: { scope: PermissionScope.write } });
    }

    async userCanReadRules(req: Request) {
        await this.wrapAuthMiddleware(req, { [PermissionType.rules]: { scope: PermissionScope.read } });
    }

    async userCanWriteWorkspaces(req: Request) {
        await this.wrapAuthMiddleware(req, { [PermissionType.admin]: { scope: PermissionScope.write } });
    }

    async userCanReadWorkspaces(req: Request) {
        await this.wrapAuthMiddleware(req, { [PermissionType.admin]: { scope: PermissionScope.read } });
    }
}

export const AuthorizerControllerMiddleware = createWorkspacesController(Authorizer, true);

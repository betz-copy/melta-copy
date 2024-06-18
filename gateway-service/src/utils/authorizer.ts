/* eslint-disable no-param-reassign */
import { Request } from 'express';
import { ServiceError, UserNotAuthorizedError } from '../express/error';
import { IUser } from '../externalServices/userService/interfaces/users';
import { ICompact, IPermission, ISubCompactPermissions } from '../externalServices/userService/interfaces/permissions/permissions';
import DefaultController from './express/controller';
import { UserService } from '../externalServices/userService';
import { WorkspaceService } from '../express/workspaces/service';
import { typedObjectEntries } from '.';
import { PermissionScope, PermissionType } from '../externalServices/userService/interfaces/permissions';

export class Authorizer extends DefaultController {
    private workspaceId: string;

    private workspacePermissions: ISubCompactPermissions;

    constructor(dbname: string, userId: string) {
        super(undefined);
        this.workspaceId = dbname;

        this.workspacePermissions = Authorizer.getWorkspacePermissions(dbname, userId);
    }

    private static async getWorkspacePermissions(workspaceId: string, userId: string): Promise<ISubCompactPermissions> {
        const workspace = await WorkspaceService.getById(this.workspaceId);

        const workspaceHierarchyIds = workspace.path.split('/');
        workspaceHierarchyIds.push(this.workspaceId);

        const permissions = await UserService.getUserPermissions(userId, workspaceHierarchyIds);

        const workspacePermissions: ISubCompactPermissions = {};

        workspaceHierarchyIds.forEach((id) => {
            if (!permissions[id]) return;
            this.mergeSubCompactPermissions(workspacePermissions, permissions[id]);
        });

        return workspacePermissions;
    }

    private static mergeSubCompactPermissions(original: ISubCompactPermissions, addition: ISubCompactPermissions) {
        Object.keys(addition).forEach((permissionType) => {
            if (!original[permissionType]) {
                original[permissionType] = addition[permissionType];
                return;
            }

            original[permissionType] = this.mergeCompactPermission(original[permissionType], addition[permissionType]);
        });
    }

    private static mergeCompactPermission(original: ICompact<IPermission>, addition: ICompact<IPermission>): ICompact<IPermission> {
        if (original.scope === PermissionScope.write || addition.scope === PermissionScope.write) return { scope: PermissionScope.write };
        if (addition.scope) original.scope = addition.scope;

        Object.keys(addition).forEach((subClass) => {
            if (subClass === 'scope') return;
            if (!original[subClass]) {
                original[subClass] = addition[subClass];
                return;
            }

            Object.keys(addition[subClass]).forEach((id) => {
                if (!original[subClass][id]) {
                    original[subClass][id] = addition[subClass][id];
                    return;
                }

                original[subClass][id] = this.mergeCompactPermission(original[subClass][id], addition[subClass][id]);
            });
        });

        return original;
    }

    // private async authorizeUser(userId: string, authPermissions: ISubCompactPermissions) {
    //     const workspace = await WorkspaceService.getById(this.workspaceId);

    //     const workspaceHierarchyIds = workspace.path.split('/');
    //     workspaceHierarchyIds.push(this.workspaceId);

    //     const userPermissions = await UserService.getUserPermissions(userId, workspaceHierarchyIds);

    //     typedObjectEntries(authPermissions).forEach(([type, permission]) => {
    //         if (!userPermissions[this.workspaceId][type]) throw new UserNotAuthorizedError();
    //     });
    // }

    // private async authirizeCompactPermission(permission: ICompact<IPermission>, authPermission: ICompact<IPermission>) {}

    // async userHasSomePermissions(req: Request) {
    //     const { [this.workspaceId]: userWorkspacePermissions } = await UserService.getUserPermissions(req.user!.id, [this.workspaceId]);
    //     if (!userWorkspacePermissions) throw new UserNotAuthorizedError();
    // }

    // private wrapAuthMiddleware(authPermissions: ISubCompactPermissions) {
    //     return async (req: Request) => this.authorizeUser(req.user!.id, authPermissions);
    // }

    // userCanWriteProcesses = this.wrapAuthMiddleware({ [PermissionType.processes]: { scope: PermissionScope.write } });

    // userCanWriteTemplates = this.wrapAuthMiddleware({ [PermissionType.templates]: { scope: PermissionScope.write } });

    // userCanWritePermissions = this.wrapAuthMiddleware({ [PermissionType.permissions]: { scope: PermissionScope.write } });

    // userCanWriteTemplatesRules = this.wrapAuthMiddleware({ [PermissionType.rules]: { scope: PermissionScope.write } });
}

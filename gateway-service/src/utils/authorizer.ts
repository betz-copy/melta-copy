import { Request } from 'express';
import { typedObjectEntries } from '.';
import { UserIncorrectScopeError, UserNotAuthorizedError } from '../express/error';
import { WorkspaceService } from '../express/workspaces/service';
import { UserService } from '../externalServices/userService';
import { PermissionScope, PermissionType } from '../externalServices/userService/interfaces/permissions';
import { ISubCompactPermissions } from '../externalServices/userService/interfaces/permissions/permissions';
import { createWorkspacesController } from './express';
import DefaultController from './express/controller';
import { WorkspaceManager } from '../express/workspaces/manager';

export type RequestWithPermissionsOfUserId = Request & { permissionsOfUserId: ISubCompactPermissions };

export class Authorizer extends DefaultController {
    constructor(private workspaceId: string) {
        super(null);
    }

    async getWorkspacePermissions(userId: string) {
        const workspaceHierarchyIds = await WorkspaceService.getWorkspaceHierarchyIds(this.workspaceId);
        workspaceHierarchyIds.push(this.workspaceId);

        const userPermissions = await UserService.getUserPermissions(userId, workspaceHierarchyIds);

        const hierarcyId = workspaceHierarchyIds.find((id) => Boolean(userPermissions[id]));

        if (!Object.keys(userPermissions) || !hierarcyId) throw new UserNotAuthorizedError();

        return userPermissions[hierarcyId];
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

    async userHasSomePermissions(req: Request) {
        (req as RequestWithPermissionsOfUserId).permissionsOfUserId = await this.getWorkspacePermissions(req.user!.id);
    }

    async userFromParamsHasSomePermissions(req: Request) {
        (req as RequestWithPermissionsOfUserId).permissionsOfUserId = await this.getWorkspacePermissions(req.params!.userId);
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

    async userIsRootAdmin(req: Request) {
        const rootWorkspace = await WorkspaceManager.getFile('/');
        const userPermissions = await UserService.getUserPermissions(req.user!.id, [rootWorkspace._id]);

        const rootPermissions = userPermissions[rootWorkspace._id];

        if (!rootPermissions?.admin?.scope) throw new UserNotAuthorizedError();

        (req as RequestWithPermissionsOfUserId).permissionsOfUserId = rootPermissions;
    }
}

export const AuthorizerControllerMiddleware = createWorkspacesController(Authorizer, true);

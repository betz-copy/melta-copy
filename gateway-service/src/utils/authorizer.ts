import { ISubCompactPermissions, PermissionScope, PermissionType } from '@packages/permission';
import { IReqUser } from '@packages/user';
import { createController } from '@packages/utils';
import { Request } from 'express';
import { UserIncorrectScopeError, UserNotAuthorizedError } from '../express/error';
import WorkspaceManager from '../express/workspaces/manager';
import WorkspaceService from '../express/workspaces/service';
import UserService from '../externalServices/userService';
import { typedObjectEntries } from '.';
import DefaultController from './express/controller';
import { redis } from './redis';

export type RequestWithPermissionsOfUserId = Request & {
    permissionsOfUserId: ISubCompactPermissions;
};

export class Authorizer extends DefaultController {
    constructor(private workspaceId: string) {
        super(null);
    }

    async getWorkspacePermissions(user: IReqUser): Promise<ISubCompactPermissions> {
        const cachedWorkspaceIds = JSON.parse((await redis.get(user._id)) ?? '[]') as string[];
        if (cachedWorkspaceIds.includes(this.workspaceId)) return user.permissions![this.workspaceId];

        const workspaceHierarchyIds = await WorkspaceService.getWorkspaceHierarchyIds(this.workspaceId);
        workspaceHierarchyIds.push(this.workspaceId);

        redis.set(user._id, JSON.stringify([...cachedWorkspaceIds, ...workspaceHierarchyIds]));
        return user.permissions![this.workspaceId];
    }

    private async authorizeUser(req: Request, user: IReqUser, authPermissions: ISubCompactPermissions) {
        const workspacePermissions = await this.getWorkspacePermissions(user);

        typedObjectEntries(authPermissions).forEach(([type, permission]) => {
            const currentPermissions = workspacePermissions?.[type] || workspacePermissions?.admin;

            if (!currentPermissions) throw new UserNotAuthorizedError();

            if (currentPermissions.scope !== PermissionScope.write && currentPermissions.scope !== permission?.scope)
                throw new UserIncorrectScopeError(currentPermissions.scope, permission?.scope);
        });

        (req as RequestWithPermissionsOfUserId).permissionsOfUserId = workspacePermissions;
    }

    async userHasSomePermissions(req: Request) {
        (req as RequestWithPermissionsOfUserId).permissionsOfUserId = await this.getWorkspacePermissions(req.user!);
    }

    async userFromParamsHasSomePermissions(req: Request) {
        const user = await UserService.getUserById(req.params!.userId as string);
        (req as RequestWithPermissionsOfUserId).permissionsOfUserId = await this.getWorkspacePermissions(user);
    }

    private async wrapAuthMiddleware(req: Request, authPermissions: ISubCompactPermissions) {
        return this.authorizeUser(req, req.user!, authPermissions);
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
        const rootPermissions = req.user?.permissions?.[rootWorkspace._id];
        if (!rootPermissions?.admin?.scope) throw new UserNotAuthorizedError();

        (req as RequestWithPermissionsOfUserId).permissionsOfUserId = rootPermissions;
    }

    async userCanWriteCategory(req: Request) {
        const userPermissions = await this.getWorkspacePermissions(req.user!);
        if (!userPermissions.admin && !userPermissions.instances?.categories[req.params.id as string])
            throw new UserIncorrectScopeError(PermissionScope.write, PermissionScope.read);
        (req as RequestWithPermissionsOfUserId).permissionsOfUserId = userPermissions;
    }
}

export const AuthorizerControllerMiddleware = createController(Authorizer, true);

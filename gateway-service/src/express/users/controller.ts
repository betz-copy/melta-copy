import { Request, Response } from 'express';
import UsersManager from './manager';

class UsersController {
    static async getMyUser(req: Request, res: Response) {
        res.json(await UsersManager.getUserById(req.user!.id));
    }

    static async getUserById(req: Request, res: Response) {
        res.json(await UsersManager.getUserById(req.params.userId));
    }

    static async getKartoffelUserProfile(req: Request, res: Response) {
        const stream = await UsersManager.getKartoffelUserProfileRequest(req.params.kartoffelId);
        res.setHeader('Content-Type', 'image/*');
        stream.pipe(res);
    }

    static async getKartoffelUserById(req: Request, res: Response) {
        res.json(await UsersManager.getKartoffelUserById(req.params.kartoffelId));
    }

    static async getUserProfile(req: Request, res: Response) {
        const stream = await UsersManager.getUserProfile(req.params.userId);
        res.setHeader('Content-Type', 'image/*');
        stream.pipe(res);
    }

    static async searchUserIds(req: Request, res: Response) {
        res.json(await UsersManager.searchUserIds(req.body));
    }

    static async searchUsers(req: Request, res: Response) {
        res.json(await UsersManager.searchUsers(req.body));
    }

    static async updateUserRoleIds(req: Request, res: Response) {
        const { workspaceId, roleIds, permissions } = req.body;

        res.json(await UsersManager.updateUserRoleIds(req.params.userId, workspaceId, permissions, roleIds));
    }

    static async updateUserUnits(req: Request, res: Response) {
        const { units } = req.body;

        res.json(await UsersManager.updateUserUnits(req.params.userId, units));
    }

    static async createUser(req: Request, res: Response) {
        const { kartoffelId, digitalIdentitySource, permissions, workspaceId, roleIds, units } = req.body;

        res.json(await UsersManager.createUser(kartoffelId, digitalIdentitySource, permissions, workspaceId, roleIds, units));
    }

    static async updateUserPreferencesMetadata(req: Request, res: Response) {
        res.json(await UsersManager.updateUserPreferencesMetadata(req.params.userId, req.body, req.file));
    }

    static async updateUserExternalMetadata(req: Request, res: Response) {
        res.json(await UsersManager.updateUserExternalMetadata(req.params.userId, req.body));
    }

    static async syncPermissions(req: Request, res: Response) {
        const { permissionType, permissions, dontDeleteUser } = req.body;
        res.json(await UsersManager.syncUserPermissions(req.params.relatedId, permissionType, permissions, dontDeleteUser));
    }

    static async deletePermissionsFromMetadata(req: Request, res: Response) {
        res.json(await UsersManager.deletePermissionsFromMetadata(req.body.query, req.body.metadata));
    }

    static async searchExternalUsers(req: Request, res: Response) {
        res.json(
            await UsersManager.searchExternalUsers(
                req.query.search as string,
                req.query.isKartoffelUser as unknown as boolean,
                req.query.workspaceId as string,
            ),
        );
    }

    static async searchUsersByPermissions(req: Request, res: Response) {
        res.json(await UsersManager.searchUsersByPermissions(req.params.workspaceId as string));
    }

    static async getRoleById(req: Request, res: Response) {
        res.json(await UsersManager.getRoleById(req.params.roleId));
    }

    static async searchRoleIds(req: Request, res: Response) {
        res.json(await UsersManager.searchRoleIds(req.body));
    }

    static async searchRoles(req: Request, res: Response) {
        res.json(await UsersManager.searchRoles(req.body));
    }

    static async createRole(req: Request, res: Response) {
        const { name, permissions } = req.body;

        res.json(await UsersManager.createRole(name, permissions));
    }

    static async updateRole(req: Request, res: Response) {
        res.json(await UsersManager.updateRole(req.params.roleId, req.body));
    }

    static async searchRolesByPermissions(req: Request, res: Response) {
        res.json(await UsersManager.searchRolesByPermissions(req.params.workspaceId as string));
    }

    static async getUserRolePerWorkspace(req: Request, res: Response) {
        res.json(await UsersManager.getUserRolePerWorkspace(req.params.workspaceId as string, req.body.roleIds));
    }

    static async getAllWorkspaceRoles(req: Request, res: Response) {
        res.json(await UsersManager.getAllWorkspaceRoles(req.body.workspaceIds));
    }
}

export default UsersController;

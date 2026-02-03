import { Request, Response } from 'express';
import UsersManager from './manager';

class UsersController {
    static async getMyUser(req: Request, res: Response) {
        res.json(await UsersManager.getUserById(req.user!.id));
    }

    static async getUserById(req: Request, res: Response) {
        res.json(await UsersManager.getUserById(req.params.userId as string));
    }

    static async getKartoffelUserProfile(req: Request, res: Response) {
        const stream = await UsersManager.getKartoffelUserProfileRequest(req.params.kartoffelId as string);
        res.setHeader('Content-Type', 'image/*');
        stream.pipe(res);
    }

    static async getKartoffelUserById(req: Request, res: Response) {
        res.json(await UsersManager.getKartoffelUserById(req.params.kartoffelId as string));
    }

    static async getUserProfile(req: Request, res: Response) {
        const stream = await UsersManager.getUserProfile(req.params.userId as string);
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

        res.json(await UsersManager.updateUserRoleIds(req.params.userId as string, workspaceId, permissions, roleIds));
    }

    static async createUser(req: Request, res: Response) {
        res.json(await UsersManager.createUser(req.body));
    }

    static async updateUserPreferencesMetadata(req: Request, res: Response) {
        res.json(await UsersManager.updateUserPreferencesMetadata(req.params.userId as string, req.body, req.file));
    }

    static async syncPermissions(req: Request, res: Response) {
        const { permissionType, permissions, dontDeleteUser } = req.body;
        res.json(await UsersManager.syncUserPermissions(req.params.relatedId as string, permissionType, permissions, dontDeleteUser));
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
        res.json(await UsersManager.getRoleById(req.params.roleId as string));
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
        res.json(await UsersManager.updateRole(req.params.roleId as string, req.body));
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

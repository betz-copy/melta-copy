import { Request, Response } from 'express';
import { UsersManager } from './manager';

export class UsersController {
    static async getMyUser(req: Request, res: Response) {
        res.json(await UsersManager.getUserById(req.user!.id));
    }

    static async getUserById(req: Request, res: Response) {
        res.json(await UsersManager.getUserById(req.params.userId));
    }

    static async getKartoffelUserProfile(req: Request, res: Response) {
        res.json(await UsersManager.getKartoffelUserProfileRequest(req.params.kartoffelId));
    }

    static async searchUserIds(req: Request, res: Response) {
        res.json(await UsersManager.searchUserIds(req.body));
    }

    static async searchUsers(req: Request, res: Response) {
        res.json(await UsersManager.searchUsers(req.body));
    }

    static async createUser(req: Request, res: Response) {
        const { kartoffelId, digitalIdentitySource, permissions } = req.body;

        res.json(await UsersManager.createUser(kartoffelId, digitalIdentitySource, permissions));
    }

    static async updateUserPreferencesMetadata(req: Request, res: Response) {
        res.json(await UsersManager.updateUserPreferencesMetadata(req.params.userId, req.body, req.file));
    }

    static async updateUserExternalMetadata(req: Request, res: Response) {
        res.json(await UsersManager.updateUserExternalMetadata(req.params.userId, req.body));
    }

    static async syncUserPermissions(req: Request, res: Response) {
        res.json(await UsersManager.syncUserPermissions(req.params.userId, req.body));
    }

    static async deletePermissionsFromMetadata(req: Request, res: Response) {
        res.json(await UsersManager.deletePermissionsFromMetadata(req.body.query, req.body.metadata));
    }

    static async searchExternalUsers(req: Request, res: Response) {
        res.json(await UsersManager.searchExternalUsers(req.query.search as string, req.query.workspaceId as string));
    }
}

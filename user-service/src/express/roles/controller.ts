import { Request, Response } from 'express';
import RolesManager from './manager';

class RolesController {
    static async getRoleById(req: Request, res: Response) {
        res.json(await RolesManager.getRoleById(req.params.id as string, req.body.workspaceIds));
    }

    static async searchRoleIds(req: Request, res: Response) {
        const { search, permissions, workspaceIds, limit, step } = req.body;

        res.json(await RolesManager.searchRoleIds(search, permissions, workspaceIds, limit, step));
    }

    static async searchRoles(req: Request, res: Response) {
        res.json(await RolesManager.searchRoles(req.body));
    }

    static async createRole(req: Request, res: Response) {
        res.json(await RolesManager.createRole(req.body));
    }

    static async updateRole(req: Request, res: Response) {
        res.json(await RolesManager.updateRole(req.params.id as string, req.body));
    }

    static async updateRolesBulk(req: Request, res: Response) {
        res.json(await RolesManager.updateRolesBulk(req.body));
    }

    static async searchRolesByPermissions(req: Request, res: Response) {
        res.json(await RolesManager.searchRolesByPermissions(req.params.workspaceId as string));
    }

    static async getAllWorkspaceRoles(req: Request, res: Response) {
        res.json(await RolesManager.getAllWorkspaceRoles(req.body.workspaceIds));
    }

    static async getUserRolePerWorkspace(req: Request, res: Response) {
        res.json(await RolesManager.getUserRolePerWorkspace(req.body.roleIds, req.params.workspaceId as string));
    }
}

export default RolesController;

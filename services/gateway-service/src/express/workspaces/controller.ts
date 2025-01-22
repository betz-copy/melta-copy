import { Request, Response } from 'express';
import DefaultController from '../../utils/express/controller';
import WorkspaceManager from './manager';

class WorkspaceController extends DefaultController<WorkspaceManager> {
    constructor(workspaceId: string) {
        super(new WorkspaceManager(workspaceId));
    }

    static async getWorkspaceIds(req: Request, res: Response) {
        res.json(await WorkspaceManager.getWorkspaceIds(req.body.type));
    }

    static async getWorkspaceHierarchyIds(req: Request, res: Response) {
        res.json(await WorkspaceManager.getWorkspaceHierarchyIds(req.params.id));
    }

    static async getDir(req: Request, res: Response) {
        res.json(await WorkspaceManager.getDir(req.body.path, req.user!.id));
    }

    static async getFile(req: Request, res: Response) {
        res.json(await WorkspaceManager.getFile(req.body.path));
    }

    static async getById(req: Request, res: Response) {
        res.json(await WorkspaceManager.getById(req.params.id));
    }

    async createOne(req: Request, res: Response) {
        res.json(await this.manager.createOne(req.body, req.files || (req.file ? [req.file] : [])));
    }

    async updateOne(req: Request, res: Response) {
        res.json(await this.manager.updateOne(req.params.id, req.body, req.files || (req.file ? [req.file] : [])));
    }

    async deleteOne(req: Request, res: Response) {
        res.json(await this.manager.deleteOne(req.params.id));
    }
}

export default WorkspaceController;

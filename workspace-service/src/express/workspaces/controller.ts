import { Request, Response } from 'express';
import { WorkspacesManager } from './manager';

export class WorkspacesController {
    static async getWorkspaceIds(req: Request, res: Response) {
        res.json(await WorkspacesManager.getWorkspaceIds(req.body.path));
    }

    static async getDir(req: Request, res: Response) {
        res.json(await WorkspacesManager.getDir(req.body.path));
    }

    static async getFile(req: Request, res: Response) {
        res.json(await WorkspacesManager.getFile(req.body.path));
    }

    static async getById(req: Request, res: Response) {
        res.json(await WorkspacesManager.getById(req.params.id));
    }

    static async createOne(req: Request, res: Response) {
        res.json(await WorkspacesManager.createOne(req.body));
    }

    static async deleteOne(req: Request, res: Response) {
        res.json(await WorkspacesManager.deleteOne(req.params.id));
    }

    static async updateOne(req: Request, res: Response) {
        res.json(await WorkspacesManager.updateOne(req.params.id, req.body));
    }
}

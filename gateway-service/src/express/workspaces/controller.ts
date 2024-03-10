import { Request, Response } from 'express';
import { WorkspaceManager } from './manager';

export class WorkspaceController {
    static async getDir(req: Request, res: Response) {
        res.json(await WorkspaceManager.getDir(req.body.path));
    }

    static async getFile(req: Request, res: Response) {
        res.json(await WorkspaceManager.getFile(req.body.path));
    }

    static async getById(req: Request, res: Response) {
        res.json(await WorkspaceManager.getById(req.params.id));
    }

    static async createOne(req: Request, res: Response) {
        res.json(await WorkspaceManager.createOne(req.body, req.files as Express.Multer.File[]));
    }

    static async updateOne(req: Request, res: Response) {
        res.json(await WorkspaceManager.updateOne(req.params.id, req.body, req.files as Express.Multer.File[]));
    }

    static async deleteOne(req: Request, res: Response) {
        res.json(await WorkspaceManager.deleteOne(req.params.id));
    }
}

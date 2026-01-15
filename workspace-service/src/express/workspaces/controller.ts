import { Request, Response } from 'express';
import WorkspacesManager from './manager';

class WorkspacesController {
    static async getWorkspaceIds(req: Request, res: Response) {
        res.json(await WorkspacesManager.getWorkspaceIds(req.body.type));
    }

    static async getWorkspaceHierarchyIds(req: Request, res: Response) {
        res.json(await WorkspacesManager.getWorkspaceHierarchyIds(req.params.id as string));
    }

    static async getDir(req: Request, res: Response) {
        res.json(await WorkspacesManager.getDir(req.body.path));
    }

    static async getFile(req: Request, res: Response) {
        res.json(await WorkspacesManager.getFile(req.body.path));
    }

    static async getById(req: Request, res: Response) {
        res.json(await WorkspacesManager.getById(req.params.id as string));
    }

    static async createOne(req: Request, res: Response) {
        res.json(await WorkspacesManager.createOne(req.body));
    }

    static async deleteOne(req: Request, res: Response) {
        res.json(await WorkspacesManager.deleteOne(req.params.id as string));
    }

    static async updateOne(req: Request, res: Response) {
        res.json(await WorkspacesManager.updateOne(req.params.id as string, req.body));
    }

    static async updateMetadata(req: Request, res: Response) {
        res.json(await WorkspacesManager.updateMetadata(req.params.id as string, req.body));
    }

    static async getWorkspaces(req: Request, res: Response) {
        res.json(await WorkspacesManager.searchWorkspaces(req.body));
    }
}

export default WorkspacesController;

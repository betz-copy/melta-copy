import * as assert from 'assert';
import { Request, Response } from 'express';
import { TemplatesManager } from './manager';

class TemplatesController {
    // all
    static async getAllAllowedTemplates(req: Request, res: Response) {
        const { user } = req;

        assert(user, 'User doesnt exists under request');

        res.json(await TemplatesManager.getAllAllowedTemplates(user.id));
    }

    // categories
    static async createCategory(req: Request, res: Response) {
        res.json(await TemplatesManager.createCategory(req.body, req.file));
    }

    static async deleteCategory(req: Request, res: Response) {
        res.json(await TemplatesManager.deleteCategory(req.params.id));
    }

    static async updateCategory(req: Request, res: Response) {
        res.json(await TemplatesManager.updateCategory(req.params.id, req.body, req.file));
    }

    // entityTemplates
    static async createEntityTemplate(req: Request, res: Response) {
        res.json(await TemplatesManager.createEntityTemplate(req.body, req.file));
    }

    static async deleteEntityTemplate(req: Request, res: Response) {
        res.json(await TemplatesManager.deleteEntityTemplate(req.params.id));
    }

    static async updateEntityTemplate(req: Request, res: Response) {
        res.json(await TemplatesManager.updateEntityTemplate(req.params.id, req.body, req.file));
    }
}

export default TemplatesController;

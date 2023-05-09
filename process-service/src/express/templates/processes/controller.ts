import { Request, Response } from 'express';
import ProcessTemplateManager from './manager';

class ProcessTemplateController {
    static async getAllTemplates(_req: Request, res: Response) {
        res.json(await ProcessTemplateManager.getAllTemplates());
    }

    static async getTemplateById(req: Request, res: Response) {
        res.json(await ProcessTemplateManager.getProcessTemplateById(req.params.id));
    }

    static async createTemplate(req: Request, res: Response) {
        res.json(await ProcessTemplateManager.createProcessTemplate(req.body));
    }

    static async deleteTemplate(req: Request, res: Response) {
        res.json(await ProcessTemplateManager.deleteProcessTemplate(req.params.id));
    }

    static async updateTemplate(req: Request, res: Response) {
        res.json(await ProcessTemplateManager.updateTemplate(req.params.id, req.body));
    }

    static async searchTemplates(req: Request, res: Response) {
        res.json(await ProcessTemplateManager.searchTemplates(req.body));
    }
}

export default ProcessTemplateController;

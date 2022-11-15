import { Request, Response } from 'express';
import ProcessTemplateManager from './manager';

class ProcessTemplateController {
    static async getTemplateById(req: Request, res: Response) {
        const { templateId: id } = req.params;
        res.json(await ProcessTemplateManager.getTemplateById(id));
    }

    static async createTemplate(req: Request, res: Response) {
        res.json(await ProcessTemplateManager.createTemplate(req.body));
    }

    static async deleteTemplate(req: Request, res: Response) {
        const { templateId: id } = req.params;
        res.json(await ProcessTemplateManager.deleteTemplate(id));
    }

    static async updateTemplate(req: Request, res: Response) {
        const { templateId: id } = req.params;
        res.json(await ProcessTemplateManager.updateTemplate(id, req.body));
    }

    static async searchTemplates(req: Request, res: Response) {
        res.json(await ProcessTemplateManager.searchTemplates(req.body));
    }
}

export default ProcessTemplateController;

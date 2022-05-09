import { Request, Response } from 'express';
import { EntityTemplateManager } from './manager';

class EntityTemplateController {
    static async searchEntityTemplates(req: Request, res: Response) {
        res.json(await EntityTemplateManager.getTemplates(req.body));
    }

    static async getEntityTemplateById(req: Request, res: Response) {
        const { templateId: id } = req.params;
        res.json(await EntityTemplateManager.getTemplateById(id));
    }

    static async createEntityTemplate(req: Request, res: Response) {
        res.json(await EntityTemplateManager.createTemplate(req.body, req.file));
    }

    static async deleteEntityTemplate(req: Request, res: Response) {
        // TODO: validate no instances exists before deleting
        const { templateId: id } = req.params;

        res.json(await EntityTemplateManager.deleteTemplate(id));
    }

    static async updateEntityTemplate(req: Request, res: Response) {
        const { templateId: id } = req.params;

        res.json(await EntityTemplateManager.updateEntityTemplate(id, req.body, req.file));
    }
}

export default EntityTemplateController;

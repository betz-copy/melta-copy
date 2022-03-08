import { Request, Response } from 'express';
import { EntityTemplateManager } from './manager';

class EntityTemplateController {
    static async getEntityTemplates(req: Request, res: Response) {
        res.json(
            await EntityTemplateManager.getTemplates(req.query as unknown as { search?: string; categoryId?: string; limit: number; skip: number }),
        );
    }

    static async getEntityTemplateById(req: Request, res: Response) {
        const { templateId: id } = req.params;
        res.json(await EntityTemplateManager.getTemplateById(id));
    }

    static async createEntityTemplate(req: Request, res: Response) {
        res.json(await EntityTemplateManager.createTemplate(req.body));
    }

    static async deleteEntityTemplate(req: Request, res: Response) {
        // TODO: validate no instances exists before deleting
        const { templateId: id } = req.params;

        res.json(await EntityTemplateManager.deleteTemplate(id));
    }

    static async updateEntityTemplate(req: Request, res: Response) {
        const { templateId: id } = req.params;

        res.json(await EntityTemplateManager.updateEntityTemplate(id, req.body));
    }
}

export default EntityTemplateController;

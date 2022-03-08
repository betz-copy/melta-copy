import { Request, Response } from 'express';
import { RelationshipTemplateManager } from './manager';

class RelationshipTemplateController {
    static async getTemplateById(req: Request, res: Response) {
        res.json(await RelationshipTemplateManager.getTemplateById(req.params.templateId));
    }

    static async updateTemplateById(req: Request, res: Response) {
        res.json(await RelationshipTemplateManager.updateTemplateById(req.params.templateId, req.body));
    }

    static async deleteTemplateById(req: Request, res: Response) {
        res.json(await RelationshipTemplateManager.deleteTemplateById(req.params.templateId));
    }

    static async createTemplate(req: Request, res: Response) {
        res.json(await RelationshipTemplateManager.createTemplate(req.body));
    }

    static async getTemplates(req: Request, res: Response) {
        res.json(
            await RelationshipTemplateManager.getTemplates(
                req.query as unknown as { search?: string; sourceEntityId?: string; destinationEntityId?: string; limit: number; skip: number },
            ),
        );
    }
}

export default RelationshipTemplateController;

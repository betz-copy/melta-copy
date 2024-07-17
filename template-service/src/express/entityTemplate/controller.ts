import { Request, Response } from 'express';
import { EntityTemplateManager } from './manager';
import { fetchPropertyFromRequest } from '../../utils/express';

class EntityTemplateController {
    static async searchEntityTemplates(req: Request, res: Response) {
        res.json(await EntityTemplateManager.getTemplates(req.body));
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

    static async updateEntityTemplateStatus(req: Request, res: Response) {
        const { templateId: id } = req.params;
        res.json(await EntityTemplateManager.updateEntityTemplateStatus(id, req.body.disabled));
    }

    static async updateEntityTemplateAction(req: Request, res: Response) {
        const { templateId: id } = req.params;
        const actionToSave = fetchPropertyFromRequest<string>(req, 'actions');
        res.json(await EntityTemplateManager.updateEntityTemplateAction(id, actionToSave));
    }
}

export default EntityTemplateController;

import { Request, Response } from 'express';
import { EntityTemplateManager } from './manager';
import dataLogger from '../../utils/logger/dataLogger';

class EntityTemplateController {
    static async searchEntityTemplates(req: Request, res: Response) {
        res.json(await EntityTemplateManager.getTemplates(req.body));
    }

    static async getEntityTemplateById(req: Request, res: Response) {
        const { templateId: id } = req.params;
        res.json(await EntityTemplateManager.getTemplateById(id));
    }

    static async createEntityTemplate(req: Request, res: Response) {
        dataLogger.info('templates', {
            userId: req.headers['user-id'],
            data: req.body,
            action: 'create',
        });
        res.json(await EntityTemplateManager.createTemplate(req.body));
    }

    static async deleteEntityTemplate(req: Request, res: Response) {
        // TODO: validate no instances exists before deleting
        const { templateId: id } = req.params;
        dataLogger.info('templates', {
            userId: req.headers['user-id'],
            templateId: id,
            action: 'delete',
        });
        res.json(await EntityTemplateManager.deleteTemplate(id));
    }

    static async updateEntityTemplate(req: Request, res: Response) {
        const { templateId: id } = req.params;
        dataLogger.info('templates', {
            userId: req.headers['user-id'],
            templateId: id,
            data: req.body,
            action: 'update',
        });
        res.json(await EntityTemplateManager.updateEntityTemplate(id, req.body));
    }

    static async updateEntityTemplateStatus(req: Request, res: Response) {
        const { templateId: id } = req.params;
        dataLogger.info('templates', {
            userId: req.headers['user-id'],
            templateId: id,
            disabled: req.body.disabled,
            action: 'update',
        });
        res.json(await EntityTemplateManager.updateEntityTemplateStatus(id, req.body.disabled));
    }
}

export default EntityTemplateController;

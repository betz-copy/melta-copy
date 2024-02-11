import assert from 'assert';
import { Request, Response } from 'express';
import { RequestWithPermissionsOfUserId } from '../instances/middlewares';
import { TemplatesManager } from './manager';

export default class TemplatesController {
    // all
    static async getAllAllowedTemplates(req: Request, res: Response) {
        const { user, permissionsOfUserId } = req as RequestWithPermissionsOfUserId;

        assert(user, 'User doesnt exists under request');

        res.json(await TemplatesManager.getAllAllowedTemplates(user.id, permissionsOfUserId));
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

    static async updateEntityTemplateStatus(req: Request, res: Response) {
        res.json(await TemplatesManager.updateEntityTemplateStatus(req.params.id, req.body.disabled));
    }

    static async updateEntityFieldValue(req: Request, res: Response) {
        const { field, values, fieldValue } = req.body;
        res.json(await TemplatesManager.updateEntityFieldValue(req.params.id, field, values, fieldValue));
    }

    static async deleteEntityFieldValue(req: Request, res: Response) {
        const { fieldValue, field } = req.body;
        res.json(await TemplatesManager.deleteEntityFieldValue(req.params.id, field, fieldValue));
    }

    // relationshipTemplates
    static async createRelationshipTemplate(req: Request, res: Response) {
        res.json(await TemplatesManager.createRelationshipTemplate(req.body));
    }

    static async deleteRelationshipTemplate(req: Request, res: Response) {
        res.json(await TemplatesManager.deleteRelationshipTemplate(req.params.id));
    }

    static async updateRelationshipTemplate(req: Request, res: Response) {
        res.json(await TemplatesManager.updateRelationshipTemplate(req.params.id, req.body));
    }

    // rules
    static async updateRuleStatusById(req: Request, res: Response) {
        res.json(await TemplatesManager.updateRuleStatusById(req.params.ruleId, req.body.disabled));
    }

    static async deleteRuleById(req: Request, res: Response) {
        res.json(await TemplatesManager.deleteRuleById(req.params.ruleId));
    }
}

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
        res.json(await TemplatesManager.createEntityTemplate(req.body, req.files as Record<string, Express.Multer.File[]>));
    }

    static async deleteEntityTemplate(req: Request, res: Response) {
        res.json(await TemplatesManager.deleteEntityTemplate(req.params.id));
    }

    static async updateEntityTemplate(req: Request, res: Response) {
        res.json(await TemplatesManager.updateEntityTemplate(req.params.id, req.body, req.files as Record<string, Express.Multer.File[]>));
    }

    static async updateEntityTemplateStatus(req: Request, res: Response) {
        res.json(await TemplatesManager.updateEntityTemplateStatus(req.params.id, req.body.disabled));
    }

    static async updateEntityEnumFieldValue(req: Request, res: Response) {
        const { field, partialInput: values, fieldValue } = req.body;
        res.json(await TemplatesManager.updateEntityEnumFieldValue(req.params.id, field, values, fieldValue));
    }

    static async deleteEntityEnumFieldValue(req: Request, res: Response) {
        const { fieldValue, partialInput: field } = req.body;
        res.json(await TemplatesManager.deleteEntityEnumFieldValue(req.params.id, field, fieldValue));
    }

    static async exportEntityToPdfTemplate(req: Request, res: Response) {
        const response = await TemplatesManager.exportEntityToPdfTemplate(req.params.entityId, req.query.pdfTemplateId as string);
        res.send(response);
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

    static async getAllRelationshipTemplates(_req: Request, res: Response) {
        res.json(await TemplatesManager.getAllRelationshipTemplates());
    }

    // rules
    static async updateRuleStatusById(req: Request, res: Response) {
        res.json(await TemplatesManager.updateRuleStatusById(req.params.ruleId, req.body.disabled));
    }

    static async deleteRuleById(req: Request, res: Response) {
        res.json(await TemplatesManager.deleteRuleById(req.params.ruleId));
    }
}

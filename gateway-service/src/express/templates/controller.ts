import assert from 'assert';
import { Request, Response } from 'express';
import { TemplatesManager } from './manager';
import DefaultController from '../../utils/express/controller';
import { RequestWithPermissionsOfUserId } from '../../utils/authorizer';

export default class TemplatesController extends DefaultController<TemplatesManager> {
    constructor(workspaceId: string) {
        super(new TemplatesManager(workspaceId));
    }

    // all
    async getAllAllowedTemplates(req: Request, res: Response) {
        const { user, permissionsOfUserId } = req as RequestWithPermissionsOfUserId;

        assert(user, 'User doesnt exists under request');

        res.json(await this.manager.getAllAllowedTemplates(user.id, permissionsOfUserId));
    }

    // categories
    async createCategory(req: Request, res: Response) {
        res.json(await this.manager.createCategory(req.body, req.file));
    }

    async deleteCategory(req: Request, res: Response) {
        res.json(await this.manager.deleteCategory(req.params.id, req.user!.id, (req as RequestWithPermissionsOfUserId).permissionsOfUserId));
    }

    async updateCategory(req: Request, res: Response) {
        res.json(await this.manager.updateCategory(req.params.id, req.body, req.file));
    }

    // entityTemplates
    async createEntityTemplate(req: Request, res: Response) {
        res.json(await this.manager.createEntityTemplate(req.body, req.file));
    }

    async deleteEntityTemplate(req: Request, res: Response) {
        res.json(await this.manager.deleteEntityTemplate(req.params.id));
    }

    async updateEntityTemplate(req: Request, res: Response) {
        res.json(await this.manager.updateEntityTemplate(req.params.id, req.body, req.file));
    }

    async updateEntityTemplateStatus(req: Request, res: Response) {
        res.json(await this.manager.updateEntityTemplateStatus(req.params.id, req.body.disabled));
    }

    async updateEntityEnumFieldValue(req: Request, res: Response) {
        const { field, partialInput: values, fieldValue } = req.body;
        res.json(await this.manager.updateEntityEnumFieldValue(req.params.id, field, values, fieldValue));
    }

    async deleteEntityEnumFieldValue(req: Request, res: Response) {
        const { fieldValue, partialInput: field } = req.body;
        res.json(await this.manager.deleteEntityEnumFieldValue(req.params.id, field, fieldValue));
    }

    // relationshipTemplates
    async createRelationshipTemplate(req: Request, res: Response) {
        res.json(await this.manager.createRelationshipTemplate(req.body));
    }

    async deleteRelationshipTemplate(req: Request, res: Response) {
        res.json(await this.manager.deleteRelationshipTemplate(req.params.id));
    }

    async updateRelationshipTemplate(req: Request, res: Response) {
        res.json(await this.manager.updateRelationshipTemplate(req.params.id, req.body));
    }

    async getAllRelationshipTemplates(_req: Request, res: Response) {
        res.json(await this.manager.getAllRelationshipTemplates());
    }

    // rules
    async updateRuleStatusById(req: Request, res: Response) {
        res.json(await this.manager.updateRuleStatusById(req.params.ruleId, req.body.disabled));
    }

    async deleteRuleById(req: Request, res: Response) {
        res.json(await this.manager.deleteRuleById(req.params.ruleId));
    }
}

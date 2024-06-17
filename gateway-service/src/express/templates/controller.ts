import assert from 'assert';
import { Request, Response } from 'express';
import { RequestWithPermissionsOfUserId } from '../instances/middlewares';
import { TemplatesManager } from './manager';
import DefaultController from '../../utils/express/controller';

export default class TemplatesController extends DefaultController<TemplatesManager> {
    constructor(dbName: string) {
        super(new TemplatesManager(dbName));
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
        res.json(await this.manager.deleteCategory(req.params.id));
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

    // rules
    async updateRuleStatusById(req: Request, res: Response) {
        res.json(await this.manager.updateRuleStatusById(req.params.ruleId, req.body.disabled));
    }

    async deleteRuleById(req: Request, res: Response) {
        res.json(await this.manager.deleteRuleById(req.params.ruleId));
    }
}

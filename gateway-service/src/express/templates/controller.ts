import assert from 'assert';
import { Request, Response } from 'express';
import { RequestWithPermissionsOfUserId } from '../../utils/authorizer';
import DefaultController from '../../utils/express/controller';
import { TemplatesManager } from './manager';
import { RequestWithSearchEntityTemplateBody } from '../../externalServices/templates/entityTemplateService';
import {
    RequestWithSearchRelationshipTemplateBody,
    RequestWithSearchRuleTemplateBody,
} from '../../externalServices/templates/relationshipsTemplateService';

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
    async getAllAllowedCategories(req: Request, res: Response) {
        const { permissionsOfUserId } = req as RequestWithPermissionsOfUserId;
        res.json(await this.manager.getAllAllowedCategories(permissionsOfUserId));
    }

    async createCategory(req: Request, res: Response) {
        res.json(await this.manager.createCategory(req.body, req.file));
    }

    async deleteCategory(req: Request, res: Response) {
        res.json(await this.manager.deleteCategory(req.params.id));
    }

    async updateCategory(req: Request, res: Response) {
        res.json(await this.manager.updateCategory(req.params.id, req.body, req.file));
    }

    async searchCategories(req: Request, res: Response) {
        const { user, permissionsOfUserId } = req as RequestWithPermissionsOfUserId;

        assert(user, 'User doesnt exists under request');

        res.json(await this.manager.getAllAllowedCategories(permissionsOfUserId));
    }

    // entityTemplates
    async createEntityTemplate(req: Request, res: Response) {
        res.json(await this.manager.createEntityTemplate(req.body, { files: req.files, file: req.file ? [req.file] : undefined }));
    }

    async deleteEntityTemplate(req: Request, res: Response) {
        res.json(await this.manager.deleteEntityTemplate(req.params.id));
    }

    async updateEntityTemplate(req: Request, res: Response) {
        res.json(await this.manager.updateEntityTemplate(req.params.id, req.body, { files: req.files, file: req.file ? [req.file] : undefined }));
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

    async searchEntityTemplates(req: Request, res: Response) {
        const { user, permissionsOfUserId, searchQuery } = req as RequestWithSearchEntityTemplateBody;
        assert(user, 'User doesnt exists under request');

        res.json(await this.manager.searchEntityTemplates(permissionsOfUserId, searchQuery));
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

    async convertToRelationshipField(req: Request, res: Response) {
        res.json(await this.manager.convertRelationshipToRelationshipField(req.params.id, req.body, req.user!.id));
    }

    async getAllRelationshipTemplates(_req: Request, res: Response) {
        res.json(await this.manager.getAllRelationshipTemplates());
    }

    async searchRelationshipTemplates(req: Request, res: Response) {
        const { user, permissionsOfUserId, searchBody } = req as RequestWithSearchRelationshipTemplateBody;
        assert(user, 'User doesnt exists under request');

        res.json(await this.manager.searchRelationshipTemplates(permissionsOfUserId, searchBody));
    }

    // rules
    async updateRuleStatusById(req: Request, res: Response) {
        res.json(await this.manager.updateRuleStatusById(req.params.ruleId, req.body.disabled));
    }

    async deleteRuleById(req: Request, res: Response) {
        res.json(await this.manager.deleteRuleById(req.params.ruleId));
    }

    async searchRulesTemplates(req: Request, res: Response) {
        const { user, permissionsOfUserId, searchBody } = req as RequestWithSearchRuleTemplateBody;
        assert(user, 'User doesnt exists under request');

        res.json(await this.manager.searchRulesTemplates(permissionsOfUserId, searchBody));
    }
}

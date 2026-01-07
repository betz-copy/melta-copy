import { ConfigTypes } from '@packages/workspace';
import assert from 'assert';
import { Request, Response } from 'express';
import config from '../../config';
import { RequestWithSearchEntityTemplateBody } from '../../externalServices/templates/entityTemplateService';
import {
    RequestWithSearchRelationshipTemplateBody,
    RequestWithSearchRuleTemplateBody,
} from '../../externalServices/templates/relationshipsTemplateService';
import { RequestWithPermissionsOfUserId } from '../../utils/authorizer';
import DefaultController from '../../utils/express/controller';
import { TemplatesManager } from './manager';

const { userDoesntExistUnderReq } = config.templateService;

export default class TemplatesController extends DefaultController<TemplatesManager> {
    constructor(workspaceId: string) {
        super(new TemplatesManager(workspaceId));
    }

    // all
    async getAllAllowedTemplates(req: Request, res: Response) {
        const { user, permissionsOfUserId } = req as RequestWithPermissionsOfUserId;

        assert(user, userDoesntExistUnderReq);

        res.json(await this.manager.getAllAllowedTemplates(user.id, permissionsOfUserId));
    }

    // categories
    async getAllAllowedCategories(req: Request, res: Response) {
        const { permissionsOfUserId } = req as RequestWithPermissionsOfUserId;
        res.json(await this.manager.getAllAllowedCategories(permissionsOfUserId));
    }

    async createCategory(req: Request, res: Response) {
        const { user, permissionsOfUserId } = req as RequestWithPermissionsOfUserId;
        assert(user, userDoesntExistUnderReq);

        res.json(await this.manager.createCategory(req.body, permissionsOfUserId, user!.id, req.file));
    }

    async deleteCategory(req: Request, res: Response) {
        res.json(await this.manager.deleteCategory(req.params.id, req.user!.id));
    }

    async updateCategory(req: Request, res: Response) {
        res.json(await this.manager.updateCategory(req.params.id, req.body, req.file));
    }

    async searchCategories(req: Request, res: Response) {
        const { user, permissionsOfUserId } = req as RequestWithPermissionsOfUserId;

        assert(user, userDoesntExistUnderReq);

        res.json(await this.manager.getAllAllowedCategories(permissionsOfUserId));
    }

    async updateCategoryTemplatesOrder(req: Request, res: Response) {
        const { srcCategoryId, newCategoryId, newIndex }: { srcCategoryId: string; newCategoryId: string; newIndex: number } = req.body;

        res.json(await this.manager.updateCategoryTemplatesOrder(req.params.templateId, newIndex, srcCategoryId, newCategoryId));
    }

    // config
    async getAllConfigs(req: Request, res: Response) {
        const { user, permissionsOfUserId } = req as RequestWithPermissionsOfUserId;
        assert(user, userDoesntExistUnderReq);

        res.json(await this.manager.getAllConfigs(permissionsOfUserId));
    }

    async getConfigByType(req: Request, res: Response) {
        const { user, permissionsOfUserId } = req as RequestWithPermissionsOfUserId;
        assert(user, userDoesntExistUnderReq);

        res.json(await this.manager.getConfigByType(req.params.type as ConfigTypes, permissionsOfUserId));
    }

    async updateCategoryOrderConfig(req: Request, res: Response) {
        const { newIndex, item }: { newIndex: number; item: string } = req.body;
        res.json(await this.manager.updateCategoryOrderConfig(req.params.configId, newIndex, item));
    }

    async createOrderConfig(req: Request, res: Response) {
        res.json(await this.manager.createCategoryOrderConfig(req.body));
    }

    // entityTemplates
    async createEntityTemplate(req: Request, res: Response) {
        const { user, permissionsOfUserId } = req as RequestWithPermissionsOfUserId;
        assert(user, userDoesntExistUnderReq);

        res.json(
            await this.manager.createEntityTemplate(req.body, permissionsOfUserId, user!.id, {
                files: req.files,
                file: req.file ? [req.file] : undefined,
            }),
        );
    }

    async deleteEntityTemplate(req: Request, res: Response) {
        res.json(await this.manager.deleteEntityTemplate(req.params.id));
    }

    async updateEntityTemplate(req: Request, res: Response) {
        const { permissionsOfUserId } = req as RequestWithPermissionsOfUserId;
        res.json(
            await this.manager.updateEntityTemplate(
                req.params.id,
                req.user!.id,
                req.body,
                {
                    files: req.files,
                    file: req.file ? [req.file] : undefined,
                },
                permissionsOfUserId,
            ),
        );
    }

    async updateEntityTemplateAction(req: Request, res: Response) {
        const { actions, isChildTemplate } = req.body;
        res.json(await this.manager.updateEntityTemplateAction(req.params.templateId, actions, isChildTemplate));
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
        assert(user, userDoesntExistUnderReq);

        res.json(await this.manager.searchEntityTemplates(permissionsOfUserId, searchQuery, user.id));
    }

    // childTemplates
    async createChildTemplate(req: Request, res: Response) {
        const { user, permissionsOfUserId } = req as RequestWithPermissionsOfUserId;
        assert(user, userDoesntExistUnderReq);

        res.json(await this.manager.createChildTemplate(req.body, permissionsOfUserId, user!.id));
    }

    async updateChildTemplate(req: Request, res: Response) {
        const { permissionsOfUserId } = req as RequestWithPermissionsOfUserId;
        res.json(await this.manager.updateChildTemplate(req.params.id, req.user!.id, req.body, permissionsOfUserId));
    }

    async updateChildTemplateStatus(req: Request, res: Response) {
        res.json(await this.manager.updateChildTemplateStatus(req.params.id, req.body.disabled));
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

    async getAllRelationshipTemplates(req: Request, res: Response) {
        const { user, permissionsOfUserId } = req as RequestWithSearchRelationshipTemplateBody;
        assert(user, userDoesntExistUnderReq);
        res.json(await this.manager.getAllAllowedRelationshipTemplates(permissionsOfUserId, user!.id));
    }

    async searchRelationshipTemplates(req: Request, res: Response) {
        const { user, permissionsOfUserId, searchBody } = req as RequestWithSearchRelationshipTemplateBody;
        assert(user, userDoesntExistUnderReq);

        res.json(await this.manager.searchRelationshipTemplates(permissionsOfUserId, searchBody, user.id));
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
        assert(user, userDoesntExistUnderReq);

        res.json(await this.manager.searchRulesTemplates(permissionsOfUserId, searchBody, req.user!.id));
    }

    async getManyRulesByIds(req: Request, res: Response) {
        const { user, permissionsOfUserId } = req as RequestWithSearchRuleTemplateBody;
        assert(user, userDoesntExistUnderReq);

        res.json(await this.manager.getManyRulesByIds(req.body.rulesIds, permissionsOfUserId, user!.id));
    }

    // Printing Templates
    async createPrintingTemplate(req: Request, res: Response) {
        res.json(await this.manager.createPrintingTemplate(req.body));
    }

    async getAllPrintingTemplates(_req: Request, res: Response) {
        res.json(await this.manager.getAllPrintingTemplates());
    }

    async getPrintingTemplateById(req: Request, res: Response) {
        res.json(await this.manager.getPrintingTemplateById(req.params.id));
    }

    async updatePrintingTemplate(req: Request, res: Response) {
        res.json(await this.manager.updatePrintingTemplate(req.params.id, req.body));
    }

    async deletePrintingTemplate(req: Request, res: Response) {
        res.json(await this.manager.deletePrintingTemplate(req.params.id));
    }

    async searchPrintingTemplates(req: Request, res: Response) {
        res.json(await this.manager.searchPrintingTemplates(req.body));
    }

    // child templates
    async updateChildTemplateById(req: Request, res: Response) {
        res.json(await this.manager.updateChildTemplateById(req.params.id, req.body));
    }
}

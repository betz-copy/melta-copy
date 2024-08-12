import { Request } from 'express';
import lodashUniqby from 'lodash.uniqby';
import { InstancesService } from '../../externalServices/instanceService';
import { IRelationship } from '../../externalServices/instanceService/interfaces/relationships';
import { IAction } from '../../externalServices/ruleBreachService/interfaces';
import { EntityTemplateService, IMongoEntityTemplatePopulated } from '../../externalServices/templates/entityTemplateService';
import { RelationshipsTemplateService } from '../../externalServices/templates/relationshipsTemplateService';
import { UserService } from '../../externalServices/userService';
import { PermissionScope } from '../../externalServices/userService/interfaces/permissions';
import { RequestWithPermissionsOfUserId } from '../../utils/authorizer';
import { getWorkspaceId } from '../../utils/express';
import DefaultController from '../../utils/express/controller';
import { ServiceError } from '../error';
import { TemplatesManager } from '../templates/manager';
import { IRule } from '../templates/rules/interfaces';
import { InstancesManager } from './manager';

export class InstancesValidator extends DefaultController {
    private entityTemplateService: EntityTemplateService;

    private instancesService: InstancesService;

    private instancesManager: InstancesManager;

    private relationshipsTemplateService: RelationshipsTemplateService;

    constructor(private workspaceId: string) {
        super(null);
        this.entityTemplateService = new EntityTemplateService(workspaceId);
        this.instancesService = new InstancesService(workspaceId);
        this.instancesManager = new InstancesManager(workspaceId);
        this.relationshipsTemplateService = new RelationshipsTemplateService(workspaceId);
    }

    // entities
    private async getCategoryIdFromTemplateId(templateId: string) {
        const template = await this.entityTemplateService.getEntityTemplateById(templateId);
        return template.category._id;
    }

    private async getCategoryIdsFromTemplateIds(templateIds: string[]) {
        const templates = await this.entityTemplateService.searchEntityTemplates({ ids: templateIds });
        return templates.map((template) => template.category._id);
    }

    async validateUserCanCreateEntityInstance(req: Request) {
        const { templateId } = req.body;

        const [categoryId, userPermissions] = await Promise.all([
            this.getCategoryIdFromTemplateId(templateId),
            UserService.getUserPermissions(req.user!.id),
        ]);

        if (!Object.keys(userPermissions[this.workspaceId].instances?.categories ?? {}).includes(categoryId)) {
            throw new ServiceError(403, 'user not authorized', { metadata: `user does not have write permission on category ${categoryId}` });
        }
    }

    async getAllowedEntityTemplatesForInstances(
        userPermissions: RequestWithPermissionsOfUserId['permissionsOfUserId'],
    ): Promise<IMongoEntityTemplatePopulated[]> {
        if (!userPermissions.instances) return [];
        const allowedCategories = Object.keys(userPermissions.instances.categories);
        return this.entityTemplateService.searchEntityTemplates({ categoryIds: allowedCategories });
    }

    async validateHasPermissionsToEntitiesInTemplates(user: Express.User, templateIds: string[]) {
        const userPermissions = await UserService.getUserPermissions(user.id);

        const allowedEntityTemplates = await this.getAllowedEntityTemplatesForInstances(userPermissions[this.workspaceId]);
        const allowedEntityTemplateIds = allowedEntityTemplates.map((entityTemplate) => entityTemplate._id);

        const unauthorizedTemplates = templateIds.filter((templateId) => !allowedEntityTemplateIds.includes(templateId));
        if (unauthorizedTemplates.length > 0) {
            throw new ServiceError(403, 'user not authorized', { metadata: `unauthorized templates ${JSON.stringify(unauthorizedTemplates)}` });
        }
    }

    async validateUserCanSearchEntitiesBatch(req: Request) {
        await this.validateHasPermissionsToEntitiesInTemplates(req.user!, Object.keys(req.body.templates));
    }

    async validateUserCanSearchEntitiesOfTemplate(req: Request) {
        const { templateId } = req.params;
        await this.validateHasPermissionsToEntitiesInTemplates(req.user!, [templateId]);
    }

    async validateUserCanExportEntities(req: Request) {
        const { templates } = req.body;
        await this.validateHasPermissionsToEntitiesInTemplates(req.user!, Object.keys(templates));
    }

    private async validateUserPermissionForEntityInstance(req: Request, permissionType: PermissionScope) {
        const instanceId = req.params.id;

        const { templateId } = await this.instancesService.getEntityInstanceById(instanceId);
        const categoryId = await this.getCategoryIdFromTemplateId(templateId);
        const userPermissions = await UserService.getUserPermissions(req.user!.id);

        if (
            !Object.entries(userPermissions[this.workspaceId].instances?.categories ?? {}).some(
                ([category, { scope }]) => category === categoryId && (scope === permissionType || scope === PermissionScope.write),
            )
        ) {
            throw new ServiceError(403, `user not authorized, does not have ${permissionType} permission on category ${categoryId}`);
        }

        (req as RequestWithPermissionsOfUserId).permissionsOfUserId = userPermissions[this.workspaceId];
    }

    async validateUserCanWriteEntityInstance(req: Request) {
        await this.validateUserPermissionForEntityInstance(req, PermissionScope.write);
    }

    private async getCategoriesIdsByEntitiesAndTemplatesIds(entitiesIds: string[], templateIdsFromReq: string[]) {
        const templateIds = new Set<string>([...templateIdsFromReq]);

        const entities = await this.instancesService.getEntityInstancesByIds(entitiesIds);
        entities.forEach((entity) => templateIds.add(entity.templateId));

        const categoriesIds = await this.getCategoryIdsFromTemplateIds([...templateIds]);

        return categoriesIds;
    }

    async validateUserCanWriteBulkEntityInstance(req: Request) {
        const { actionsGroups } = req.body;

        const { templateIds, entitiesIds } = this.instancesManager.extractEntitiesAndTemplatesIds(actionsGroups as IAction[][]);

        const [categoriesIds, userPermissions] = await Promise.all([
            this.getCategoriesIdsByEntitiesAndTemplatesIds(entitiesIds, templateIds),
            UserService.getUserPermissions(req.user!.id),
        ]);

        if (
            !Object.entries(userPermissions[this.workspaceId].instances?.categories ?? {}).some(
                ([categoryId, { scope }]) => categoriesIds.includes(categoryId) && scope === PermissionScope.write,
            )
        ) {
            throw new ServiceError(403, `user not authorized, does not have ${PermissionScope.write} permission on categories ${categoriesIds}`);
        }

        (req as RequestWithPermissionsOfUserId).permissionsOfUserId = userPermissions[this.workspaceId];
    }

    async validateUserCanReadEntityInstance(req: Request) {
        await this.validateUserPermissionForEntityInstance(req, PermissionScope.read);
    }

    async validateUserCanGetExpandedEntity(req: Request) {
        const {
            body: { templateIds },
            permissionsOfUserId,
        } = req as RequestWithPermissionsOfUserId;
        req.body.userId = req.user!.id;

        const templatesManager = new TemplatesManager(await getWorkspaceId(req));

        const allAllowedEntityTemplates = (await templatesManager.getAllAllowedEntityTemplates(permissionsOfUserId)).map(
            (entityTemplate) => entityTemplate._id,
        );
        const isAllowedAllTemplates = (templateIds as string[]).every((templateId) => allAllowedEntityTemplates.includes(templateId));

        if (!isAllowedAllTemplates)
            throw new ServiceError(403, 'user not authorized', { metadata: `unauthorized templates ${JSON.stringify(templateIds)}` });
    }

    // relationships
    private async getRelatedCategoriesFromRelationshipInstance(relationshipInstance: IRelationship) {
        const { templateId: relationshipTemplateId } = relationshipInstance;

        const relationshipTemplate = await this.relationshipsTemplateService.getRelationshipTemplateById(relationshipTemplateId);
        const { sourceEntityId, destinationEntityId } = relationshipTemplate;

        const [{ category: srcCategory }, { category: dstCategory }] = await Promise.all([
            this.entityTemplateService.getEntityTemplateById(sourceEntityId),
            this.entityTemplateService.getEntityTemplateById(destinationEntityId),
        ]);

        return lodashUniqby([srcCategory._id, dstCategory._id], (categoryId) => categoryId);
    }

    async validateUserCanCreateRelationshipInstance(req: Request) {
        const [relatedCategories, userPermissions] = await Promise.all([
            this.getRelatedCategoriesFromRelationshipInstance(req.body.relationshipInstance),
            UserService.getUserPermissions(req.user!.id),
        ]);

        if (
            !Object.entries(userPermissions[this.workspaceId].instances?.categories ?? {}).some(
                ([categoryId, { scope }]) => relatedCategories.includes(categoryId) && scope === PermissionScope.write,
            )
        ) {
            throw new ServiceError(403, `user not authorized, does not have ${PermissionScope.write} permission on categories ${relatedCategories}`);
        }
    }

    async validateUserCanUpdateOrDeleteRelationshipInstance(req: Request) {
        const relationshipInstance = await this.instancesService.getRelationshipInstanceById(req.params.id);

        const [relatedCategories, userPermissions] = await Promise.all([
            this.getRelatedCategoriesFromRelationshipInstance(relationshipInstance),
            UserService.getUserPermissions(req.user!.id),
        ]);

        if (
            !Object.entries(userPermissions[this.workspaceId].instances?.categories ?? {}).some(
                ([categoryId, { scope }]) => relatedCategories.includes(categoryId) && scope === PermissionScope.write,
            )
        ) {
            throw new ServiceError(403, `user not authorized, does not have ${PermissionScope.write} permission on categories ${relatedCategories}`);
        }
    }

    // rules
    async validateUserCanIgnoreRules(req: Request) {
        const { ignoredRules } = req.body;
        const { user } = req;

        if (!user) throw new Error('req.user is undefined');

        const userPermissions = await UserService.getUserPermissions(user.id);

        if (userPermissions[this.workspaceId].rules?.scope !== PermissionScope.write) {
            throw new ServiceError(403, 'user not authorized', { metadata: 'user does not have write permission on rules' });
        }

        const ignoredRulesPopulated: IRule[] = await Promise.all(
            ignoredRules.map((ignoredRule) => this.relationshipsTemplateService.getRuleById(ignoredRule.ruleId)),
        );

        if (ignoredRulesPopulated.some((rule) => rule.actionOnFail !== 'WARNING')) {
            throw new ServiceError(403, 'a user without rule permissions only ignore "WARNING" rules', {});
        }
    }
}

import { Request } from 'express';
import lodashUniqby from 'lodash.uniqby';
import { IMongoEntityTemplatePopulated } from '@microservices/shared/src/interfaces/entityTemplate';
import { IRule } from '@microservices/shared/src/interfaces/rule';
import { InstancesService } from '../../externalServices/instanceService';
import { IRelationship } from '../../externalServices/instanceService/interfaces/relationships';
import { IAction } from '../../externalServices/ruleBreachService/interfaces';
import { EntityTemplateService } from '../../externalServices/templates/entityTemplateService';
import { RelationshipsTemplateService } from '../../externalServices/templates/relationshipsTemplateService';
import { PermissionScope } from '../../externalServices/userService/interfaces/permissions';
import { Authorizer, RequestWithPermissionsOfUserId } from '../../utils/authorizer';
import { getWorkspaceId } from '../../utils/express';
import DefaultController from '../../utils/express/controller';
import { ForbiddenError, ServiceError } from '../error';
import { TemplatesManager } from '../templates/manager';
import { InstancesManager } from './manager';

export class InstancesValidator extends DefaultController {
    private entityTemplateService: EntityTemplateService;

    private instancesService: InstancesService;

    private instancesManager: InstancesManager;

    private relationshipsTemplateService: RelationshipsTemplateService;

    private authorizer: Authorizer;

    constructor(workspaceId: string) {
        super(null);
        this.entityTemplateService = new EntityTemplateService(workspaceId);
        this.instancesService = new InstancesService(workspaceId);
        this.instancesManager = new InstancesManager(workspaceId);
        this.relationshipsTemplateService = new RelationshipsTemplateService(workspaceId);
        this.authorizer = new Authorizer(workspaceId);
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
            this.authorizer.getWorkspacePermissions(req.user!.id),
        ]);

        if (!userPermissions.admin?.scope && !Object.keys(userPermissions.instances?.categories ?? {}).includes(categoryId)) {
            throw new ForbiddenError('user not authorized', { metadata: `user does not have write permission on category ${categoryId}` });
        }
    }

    async getAllowedEntityTemplatesForInstances(
        userPermissions: RequestWithPermissionsOfUserId['permissionsOfUserId'],
    ): Promise<IMongoEntityTemplatePopulated[]> {
        if (!userPermissions.admin && !userPermissions.instances) return [];
        const allowedCategories = Object.keys(userPermissions.instances?.categories ?? {});
        return this.entityTemplateService.searchEntityTemplates(userPermissions.admin ? {} : { categoryIds: allowedCategories });
    }

    async validateHasPermissionsToEntitiesInTemplates(user: Express.User, templateIds: string[]) {
        const allowedEntityTemplates = await this.getAllowedEntityTemplatesForInstances(await this.authorizer.getWorkspacePermissions(user.id));
        const allowedEntityTemplateIds = allowedEntityTemplates.map((entityTemplate) => entityTemplate._id);

        const unauthorizedTemplates = templateIds.filter((templateId) => !allowedEntityTemplateIds.includes(templateId));
        if (unauthorizedTemplates.length > 0) {
            throw new ForbiddenError('user not authorized', { metadata: `unauthorized templates ${JSON.stringify(unauthorizedTemplates)}` });
        }
    }

    async validateUserCanSearchEntitiesBatch(req: Request) {
        await this.validateHasPermissionsToEntitiesInTemplates(req.user!, Object.keys(req.body.templates));
    }

    async validateUserCanSearchEntitiesByTemplates(req: Request) {
        const { templateIds } = req.body;
        await this.validateHasPermissionsToEntitiesInTemplates(req.user!, templateIds);
    }

    async validateUserCanSearchEntitiesOfTemplate(req: Request) {
        const { templateId } = req.params;
        await this.validateHasPermissionsToEntitiesInTemplates(req.user!, [templateId]);
    }

    async validateUserCanExportEntities(req: Request) {
        const { templates } = req.body;
        await this.validateHasPermissionsToEntitiesInTemplates(req.user!, Object.keys(templates));
    }

    private async validateUserPermissionForEntityInstance(req: Request, permissionScope: PermissionScope) {
        const instanceId = req.params.id;

        const { templateId } = await this.instancesService.getEntityInstanceById(instanceId);
        const categoryId = await this.getCategoryIdFromTemplateId(templateId);

        const userPermissions = await this.authorizer.getWorkspacePermissions(req.user!.id);

        if (
            !userPermissions.admin?.scope &&
            !Object.entries(userPermissions.instances?.categories ?? {}).some(
                ([category, { scope }]) => category === categoryId && (scope === permissionScope || scope === PermissionScope.write),
            )
        ) {
            throw new ForbiddenError(`user not authorized, does not have ${permissionScope} permission on category ${categoryId}`);
        }

        (req as RequestWithPermissionsOfUserId).permissionsOfUserId = userPermissions;
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
            this.authorizer.getWorkspacePermissions(req.user!.id),
        ]);

        if (
            !userPermissions.admin?.scope &&
            !Object.entries(userPermissions.instances?.categories ?? {}).some(
                ([categoryId, { scope }]) => categoriesIds.includes(categoryId) && scope === PermissionScope.write,
            )
        ) {
            throw new ForbiddenError(`user not authorized, does not have ${PermissionScope.write} permission on categories ${categoriesIds}`);
        }

        (req as RequestWithPermissionsOfUserId).permissionsOfUserId = userPermissions;
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
            throw new ForbiddenError('user not authorized', { metadata: `unauthorized templates ${JSON.stringify(templateIds)}` });
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
            this.authorizer.getWorkspacePermissions(req.user!.id),
        ]);

        if (
            !userPermissions.admin?.scope &&
            !Object.entries(userPermissions.instances?.categories ?? {}).some(
                ([categoryId, { scope }]) => relatedCategories.includes(categoryId) && scope === PermissionScope.write,
            )
        ) {
            throw new ForbiddenError(`user not authorized, does not have ${PermissionScope.write} permission on categories ${relatedCategories}`);
        }
    }

    async validateUserCanUpdateOrDeleteRelationshipInstance(req: Request) {
        const relationshipInstance = await this.instancesService.getRelationshipInstanceById(req.params.id);

        const [relatedCategories, userPermissions] = await Promise.all([
            this.getRelatedCategoriesFromRelationshipInstance(relationshipInstance),
            this.authorizer.getWorkspacePermissions(req.user!.id),
        ]);

        if (
            !userPermissions.admin?.scope &&
            !Object.entries(userPermissions.instances?.categories ?? {}).some(
                ([categoryId, { scope }]) => relatedCategories.includes(categoryId) && scope === PermissionScope.write,
            )
        ) {
            throw new ForbiddenError(`user not authorized, does not have ${PermissionScope.write} permission on categories ${relatedCategories}`);
        }
    }

    // rules
    async validateUserCanIgnoreRules(req: Request) {
        const { ignoredRules } = req.body;
        const { user } = req;

        if (!user) throw new ServiceError(undefined, 'req.user is undefined');

        const userPermissions = await this.authorizer.getWorkspacePermissions(user.id);

        if (!userPermissions.admin?.scope && userPermissions.rules?.scope !== PermissionScope.write) return;

        const ignoredRulesPopulated: IRule[] = await Promise.all(
            ignoredRules.map((ignoredRule) => this.relationshipsTemplateService.getRuleById(ignoredRule.ruleId)),
        );

        if (ignoredRulesPopulated.some((rule) => rule.actionOnFail !== 'WARNING')) {
            throw new ForbiddenError('a user without rule permissions only ignore "WARNING" rules', {});
        }
    }
}

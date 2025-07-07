import {
    ForbiddenError,
    IAction,
    IBrokenRule,
    IEntityChildTemplatePopulated,
    IExportEntitiesBody,
    IMongoEntityTemplatePopulated,
    IRelationship,
    IRule,
    PermissionScope,
    ServiceError,
} from '@microservices/shared';
import { Request } from 'express';
import lodashUniqby from 'lodash.uniqby';
import InstancesService from '../../externalServices/instanceService';
import EntityTemplateService from '../../externalServices/templates/entityTemplateService';
import RelationshipsTemplateService from '../../externalServices/templates/relationshipsTemplateService';
import { Authorizer, RequestWithPermissionsOfUserId } from '../../utils/authorizer';
import { getWorkspaceId } from '../../utils/express';
import DefaultController from '../../utils/express/controller';
import { TemplatesManager } from '../templates/manager';
import InstancesManager from './manager';

class InstancesValidator extends DefaultController {
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

    private async getCategoryIdsFromTemplateIds(templateIds: string[], userId: string) {
        const templates = await this.entityTemplateService.searchEntityTemplates(userId, { ids: templateIds });
        return templates.map((template) => template.category._id);
    }

    async validateUserCanCreateEntityInstance(req: Request) {
        const { templateId, childTemplateId } = req.body;
        await this.validateUserPermissionForEntityInstance(req, templateId, PermissionScope.write, undefined, childTemplateId);
    }

    async getAllowedEntityTemplatesForInstances(
        userPermissions: RequestWithPermissionsOfUserId['permissionsOfUserId'],
        userId: string,
    ): Promise<IMongoEntityTemplatePopulated[]> {
        if (!userPermissions.admin && !userPermissions.instances) return [];
        const allowedCategories = Object.keys(userPermissions.instances?.categories ?? {});
        return this.entityTemplateService.searchEntityTemplates(userId, userPermissions.admin ? {} : { categoryIds: allowedCategories });
    }

    async validateHasPermissionsToEntitiesInTemplates(user: Express.User, templateIds: string[]) {
        const allowedEntityTemplates = await this.getAllowedEntityTemplatesForInstances(
            await this.authorizer.getWorkspacePermissions(user.id),
            user.id,
        );
        const allowedEntityTemplateIds = allowedEntityTemplates.map((entityTemplate) => entityTemplate._id);

        const unauthorizedTemplates = templateIds.filter((templateId) => !allowedEntityTemplateIds.includes(templateId));
        if (unauthorizedTemplates.length > 0) {
            throw new ForbiddenError('user not authorized', { metadata: `unauthorized templates ${JSON.stringify(unauthorizedTemplates)}` });
        }
    }

    async getAllowedEntityChildTemplatesForInstances(
        userPermissions: RequestWithPermissionsOfUserId['permissionsOfUserId'],
        userId: string,
    ): Promise<IEntityChildTemplatePopulated[]> {
        if (!userPermissions.admin && !userPermissions.instances) return [];
        const allowedCategories = Object.keys(userPermissions.instances?.categories ?? {});
        return this.entityTemplateService.searchChildTemplates(userId, userPermissions.admin ? {} : { categoryIds: allowedCategories });
    }

    async validateHasPermissionsToEntitiesInChildTemplates(user: Express.User, templateIds: string[]) {
        const allowedChildTemplates = await this.getAllowedEntityChildTemplatesForInstances(
            await this.authorizer.getWorkspacePermissions(user.id),
            user.id,
        );
        const allowedChildTemplateIds = allowedChildTemplates.map((childTemplate) => childTemplate._id);

        const unauthorizedTemplates = templateIds.filter((templateId) => !allowedChildTemplateIds.includes(templateId));
        if (unauthorizedTemplates.length > 0) {
            throw new ForbiddenError('user not authorized', { metadata: `unauthorized child templates ${JSON.stringify(unauthorizedTemplates)}` });
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
        const { templates } = req.body as IExportEntitiesBody;

        const childTemplates = Object.entries(templates)
            .filter(([_, value]) => value.isChildTemplate)
            .map(([key]) => key);
        const parentTemplates = Object.entries(templates)
            .filter(([_, value]) => !value.isChildTemplate)
            .map(([key]) => key);

        await this.validateHasPermissionsToEntitiesInTemplates(req.user!, parentTemplates);
        await this.validateHasPermissionsToEntitiesInChildTemplates(req.user!, childTemplates);
    }

    private async validateUserPermissionForEntityInstance(
        req: Request,
        templateId: string,
        permissionScope: PermissionScope,
        givenCategoryId?: string,
        childTemplateId?: string,
    ) {
        const categoryId = givenCategoryId ?? (await this.getCategoryIdFromTemplateId(templateId));
        const userPermissions = await this.authorizer.getWorkspacePermissions(req.user!.id);

        if (
            !userPermissions.admin?.scope &&
            !Object.entries(userPermissions.instances?.categories ?? {}).some(([category, { scope, entityTemplates }]) => {
                const templatePermissions = entityTemplates?.[templateId];
                return (
                    category === categoryId &&
                    (scope === permissionScope ||
                        scope === PermissionScope.write ||
                        templatePermissions?.scope === permissionScope ||
                        templatePermissions?.scope === PermissionScope.write ||
                        (childTemplateId
                            ? templatePermissions?.entityChildTemplates[childTemplateId]?.scope === permissionScope ||
                              templatePermissions?.entityChildTemplates[childTemplateId]?.scope === PermissionScope.write
                            : true))
                );
            })
        ) {
            throw new ForbiddenError(
                `user not authorized, does not have ${permissionScope} permission on template ${templateId} in category ${categoryId}`,
            );
        }
        (req as RequestWithPermissionsOfUserId).permissionsOfUserId = userPermissions;
    }

    async validateUserCanWriteEntityInstance(req: Request) {
        const { id } = req.params;
        const { templateId } = await this.instancesService.getEntityInstanceById(id);

        await this.validateUserPermissionForEntityInstance(req, templateId, PermissionScope.write);
    }

    async validateUserCanWriteBulkEntityInstances(req: Request) {
        const { templateId, childTemplateId } = req.body;

        await this.validateUserPermissionForEntityInstance(req, templateId, PermissionScope.write, undefined, childTemplateId);
    }

    private async getCategoriesIdsByEntitiesAndTemplatesIds(entitiesIds: string[], templateIdsFromReq: string[], userId: string) {
        const templateIds = new Set<string>([...templateIdsFromReq]);

        const entities = await this.instancesService.getEntityInstancesByIds(entitiesIds);
        entities.forEach((entity) => templateIds.add(entity.templateId));

        const categoriesIds = await this.getCategoryIdsFromTemplateIds([...templateIds], userId);

        return categoriesIds;
    }

    async validateUserCanWriteBulkEntityInstance(req: Request) {
        const { actionsGroups } = req.body;

        const { templateIds, entitiesIds } = this.instancesManager.extractEntitiesAndTemplatesIds(actionsGroups as IAction[][]);

        const [categoriesIds, userPermissions] = await Promise.all([
            this.getCategoriesIdsByEntitiesAndTemplatesIds(entitiesIds, templateIds, req.user!.id),
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
        const { id } = req.params;
        const { templateId } = await this.instancesService.getEntityInstanceById(id);

        await this.validateUserPermissionForEntityInstance(req, templateId, PermissionScope.read);
    }

    async validateUserCanGetChart(req: Request) {
        const { templateId } = req.params;

        await this.validateUserPermissionForEntityInstance(req, templateId, PermissionScope.read);
    }

    async validateUserCanGetExpandedEntity(req: Request) {
        const {
            body: { templateIds },
            permissionsOfUserId,
        } = req as RequestWithPermissionsOfUserId;
        req.body.userId = req.user!.id;

        const templatesManager = new TemplatesManager(await getWorkspaceId(req));

        const allAllowedEntityTemplates = (await templatesManager.getAllAllowedEntityTemplates(permissionsOfUserId, req.user!.id)).map(
            (entityTemplate) => entityTemplate._id,
        );
        const isAllowedAllTemplates = (templateIds as string[]).every((templateId) => allAllowedEntityTemplates.includes(templateId));

        if (!isAllowedAllTemplates)
            throw new ForbiddenError('user not authorized', { metadata: `unauthorized templates ${JSON.stringify(templateIds)}` });
    }

    // relationships
    private async getRelatedTemplatesFromRelationshipInstance(relationshipInstance: IRelationship) {
        const { templateId: relationshipTemplateId } = relationshipInstance;

        const relationshipTemplate = await this.relationshipsTemplateService.getRelationshipTemplateById(relationshipTemplateId);
        const { sourceEntityId, destinationEntityId } = relationshipTemplate;

        const [srcTemplate, dstTemplate] = await Promise.all([
            this.entityTemplateService.getEntityTemplateById(sourceEntityId),
            this.entityTemplateService.getEntityTemplateById(destinationEntityId),
        ]);

        return lodashUniqby([srcTemplate, dstTemplate], (template) => template._id);
    }

    async validateUserCanCreateRelationshipInstance(req: Request) {
        const relatedTemplates = await this.getRelatedTemplatesFromRelationshipInstance(req.body.relationshipInstance);

        await Promise.all(
            relatedTemplates.map((template) =>
                this.validateUserPermissionForEntityInstance(req, template._id, PermissionScope.write, template.category._id),
            ),
        );
    }

    async validateUserCanUpdateOrDeleteRelationshipInstance(req: Request) {
        const relationshipInstance = await this.instancesService.getRelationshipInstanceById(req.params.id);
        const relatedTemplates = await this.getRelatedTemplatesFromRelationshipInstance(relationshipInstance);

        await Promise.all(
            relatedTemplates.map((template) =>
                this.validateUserPermissionForEntityInstance(req, template._id, PermissionScope.write, template.category._id),
            ),
        );
    }

    // rules
    async validateUserCanIgnoreRules(req: Request) {
        const { ignoredRules } = req.body;
        const { user } = req;
        await this.validateEnforcementRules(user, ignoredRules);
    }

    async validateUserCanIgnoreRulesMultipleUpdate(req: Request) {
        const { ignoredRules } = req.body;
        const { user } = req;
        await this.validateEnforcementRules(user, Object.values(ignoredRules).flat() as IBrokenRule[]);
    }

    private async validateEnforcementRules(user: Express.User | undefined, ignoredRules: IBrokenRule[]) {
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

export default InstancesValidator;

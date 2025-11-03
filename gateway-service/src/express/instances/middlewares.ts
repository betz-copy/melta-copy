import {
    ActionOnFail,
    ForbiddenError,
    IAction,
    IBrokenRule,
    IChildTemplatePopulated,
    IExportEntitiesBody,
    IMongoEntityTemplatePopulated,
    IRelationship,
    IRule,
    PermissionScope,
    ServiceError,
} from '@microservices/shared';
import { Request } from 'express';
import { uniqBy } from 'lodash';
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
    private async getCategoryIdFromTemplateId(templateId: string, isChildTemplate?: boolean) {
        const template = isChildTemplate
            ? await this.entityTemplateService.getChildTemplateById(templateId)
            : await this.entityTemplateService.getEntityTemplateById(templateId);
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
        const permissions = await this.authorizer.getWorkspacePermissions(user.id);

        const [allowedEntityTemplates, allowedChildTemplates] = await Promise.all([
            this.getAllowedEntityTemplatesForInstances(permissions, user.id),
            this.getAllowedChildTemplatesForInstances(permissions),
        ]);

        const allowedEntityTemplateIds = [...allowedEntityTemplates.map(({ _id }) => _id), ...allowedChildTemplates.map(({ _id }) => _id)];

        const unauthorizedTemplates = templateIds.filter((templateId) => !allowedEntityTemplateIds.includes(templateId));
        if (unauthorizedTemplates.length > 0) {
            throw new ForbiddenError('user not authorized', { metadata: `unauthorized templates ${JSON.stringify(unauthorizedTemplates)}` });
        }
    }

    async getAllowedChildTemplatesForInstances(
        userPermissions: RequestWithPermissionsOfUserId['permissionsOfUserId'],
    ): Promise<IChildTemplatePopulated[]> {
        if (!userPermissions.admin && !userPermissions.instances) return [];
        const allowedCategories = Object.keys(userPermissions.instances?.categories ?? {});
        return this.entityTemplateService.searchChildTemplates(userPermissions.admin ? {} : { categoryIds: allowedCategories });
    }

    async validateUserCanSearchEntitiesBatch(req: Request) {
        const templateIds = Object.entries(req.body.templates ?? {}).map(([templateId, template]) => {
            if (typeof template === 'object' && template !== null && 'childTemplateId' in template)
                return (template.childTemplateId as string | undefined) ?? templateId;
            return templateId;
        });

        await this.validateHasPermissionsToEntitiesInTemplates(req.user!, templateIds);
    }

    async validateUserCanSearchEntitiesByTemplates(req: Request) {
        const { templateIds, childTemplateIds } = req.body;
        await this.validateHasPermissionsToEntitiesInTemplates(req.user!, [...templateIds, ...childTemplateIds]);
    }

    async validateUserCanSearchEntitiesOfTemplate(req: Request) {
        const { templateId } = req.params;
        await this.validateHasPermissionsToEntitiesInTemplates(req.user!, req.body.childTemplateId || [templateId]);
    }

    async validateUserCanExportEntities(req: Request) {
        const { templates } = req.body as IExportEntitiesBody;
        await this.validateHasPermissionsToEntitiesInTemplates(req.user!, Object.keys(templates));
    }

    private async validateUserPermissionForEntityInstance(
        req: Request,
        templateId: string,
        permissionScope: PermissionScope,
        givenCategoryId?: string,
        childTemplateId?: string,
    ) {
        const categoryId = givenCategoryId ?? (await this.getCategoryIdFromTemplateId(childTemplateId || templateId, !!childTemplateId));
        const userPermissions = await this.authorizer.getWorkspacePermissions(req.user!.id);

        const childTemplates = await this.getAllowedChildTemplatesForInstances(userPermissions);
        const childTemplate = childTemplates.find(({ _id }) => _id === childTemplateId);

        if (
            !userPermissions.admin?.scope &&
            !Object.entries(userPermissions.instances?.categories ?? {}).some(
                ([category, { scope, entityTemplates }]) =>
                    category === categoryId &&
                    (scope === permissionScope ||
                        scope === PermissionScope.write ||
                        entityTemplates?.[childTemplate?._id ?? templateId]?.scope === permissionScope ||
                        entityTemplates?.[childTemplate?._id ?? templateId]?.scope === PermissionScope.write),
            )
        ) {
            throw new ForbiddenError(
                `user not authorized, does not have ${permissionScope} permission on template ${templateId} in category ${categoryId}`,
            );
        }
        (req as RequestWithPermissionsOfUserId).permissionsOfUserId = userPermissions;
    }

    async validateUserCanWriteEntityInstance(req: Request) {
        const { id } = req.params;
        const { childTemplateId } = req.body;
        const { templateId } = await this.instancesService.getEntityInstanceById(id);

        await this.validateUserPermissionForEntityInstance(req, templateId, PermissionScope.write, undefined, childTemplateId);
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

        await this.validateUserPermissionForEntityInstance(req, templateId, PermissionScope.read, undefined, req.body.childTemplateId);
    }

    async validateUserCanGetChart(req: Request) {
        const { templateId } = req.params;

        await this.validateUserPermissionForEntityInstance(req, templateId, PermissionScope.read, undefined, req.body.childTemplateId);
    }

    async validateUserCanGetExpandedEntity(req: Request) {
        const {
            body: { templateIds },
            permissionsOfUserId,
        } = req as RequestWithPermissionsOfUserId;
        req.body.userId = req.user!.id;

        const templatesManager = new TemplatesManager(await getWorkspaceId(req));

        const [allowedEntityTemplates, allowedChildTemplates] = await Promise.all([
            templatesManager.getAllAllowedEntityTemplates(permissionsOfUserId, req.user!.id),
            this.getAllowedChildTemplatesForInstances(permissionsOfUserId),
        ]);

        const allowedEntityTemplateIds = [...allowedEntityTemplates.map(({ _id }) => _id), ...allowedChildTemplates.map(({ _id }) => _id)];

        const isAllowedAllTemplates = (templateIds as string[]).every((templateId) => allowedEntityTemplateIds.includes(templateId));

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

        return uniqBy([srcTemplate, dstTemplate], (template) => template._id);
    }

    async validateUserCanCreateRelationshipInstance(req: Request) {
        const relatedTemplates = await this.getRelatedTemplatesFromRelationshipInstance(req.body.relationshipInstance);
        const childTemplatesOfParents = await this.entityTemplateService.searchChildTemplates({
            parentTemplatesIds: relatedTemplates.map(({ _id }) => _id),
        });

        await Promise.all(
            relatedTemplates.map(({ _id, category }) => {
                const childTemplateId = childTemplatesOfParents.find(({ parentTemplate }) => parentTemplate._id === _id)?._id;
                return this.validateUserPermissionForEntityInstance(req, _id, PermissionScope.write, category._id, childTemplateId);
            }),
        );
    }

    async validateUserCanUpdateOrDeleteRelationshipInstance(req: Request) {
        const relationshipInstance = await this.instancesService.getRelationshipInstanceById(req.params.id);
        const relatedTemplates = await this.getRelatedTemplatesFromRelationshipInstance(relationshipInstance);

        const childTemplatesOfParents = await this.entityTemplateService.searchChildTemplates({
            parentTemplatesIds: relatedTemplates.map(({ _id }) => _id),
        });

        await Promise.all(
            relatedTemplates.map(({ _id, category }) => {
                const childTemplateId = childTemplatesOfParents.find(({ parentTemplate }) => parentTemplate._id === _id)?._id;
                this.validateUserPermissionForEntityInstance(req, _id, PermissionScope.write, category._id, childTemplateId);
            }),
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

        if (ignoredRulesPopulated.some((rule) => rule.actionOnFail !== ActionOnFail.WARNING)) {
            throw new ForbiddenError('a user without rule permissions only ignore "WARNING" rules', {});
        }
    }
}

export default InstancesValidator;

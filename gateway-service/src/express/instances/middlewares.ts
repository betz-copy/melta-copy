import { Request } from 'express';
import lodashUniqby from 'lodash.uniqby';
import { EntityTemplateService } from '../../externalServices/entityTemplateService';
import { IRelationship } from '../../externalServices/instanceService/interfaces/relationships';
import { InstancesService } from '../../externalServices/instanceService';
import { RelationshipsTemplateService } from '../../externalServices/relationshipsTemplateService';
import { ServiceError } from '../error';
import { TemplatesManager } from '../templates/manager';
import { IRule } from '../templates/rules/interfaces';
import { getWorkspaceId } from '../../utils/express';
import { PermissionScope } from '../../externalServices/userService/interfaces/permissions';
import { UserService } from '../../externalServices/userService';
import { ISubCompactPermissions } from '../../externalServices/userService/interfaces/permissions/permissions';

// entities
const getCategoryIdFromTemplateId = async (entityTemplateService: EntityTemplateService, templateId: string) => {
    const template = await entityTemplateService.getEntityTemplateById(templateId);
    const { category } = template;

    return category._id;
};

export const validateUserCanCreateEntityInstance = async (req: Request) => {
    const { templateId } = req.body;

    const workspaceId = await getWorkspaceId(req);

    const entityTemplateService = new EntityTemplateService(workspaceId);

    const categoryId = await getCategoryIdFromTemplateId(entityTemplateService, templateId);

    const userPermissions = await UserService.getUserPermissions(req.user!.id);

    // TODO-WORKSPACES
    if (!userPermissions[workspaceId].instances?.categories.some(({ category }) => category === categoryId)) {
        throw new ServiceError(403, 'user not authorized', { metadata: `user does not have write permission on category ${categoryId}` });
    }
    // return validateAuthorization(req, 'Instances', [categoryId], 'Write');
};

export const getAllowedEntityTemplatesForInstances = (entityTemplateService: EntityTemplateService, userPermissions: ISubCompactPermissions) => {
    if (!userPermissions.instances) return [];
    const allowedCategories = Object.keys(userPermissions.instances.categories);
    return entityTemplateService.searchEntityTemplates({ categoryIds: allowedCategories });
};

export const validateHasPermissionsToEntitiesInTemplates = async (
    entityTemplateService: EntityTemplateService,
    user: Express.User,
    templateIds: string[],
) => {
    const userPermissions = await UserService.getUserPermissions(user.id);

    const allowedEntityTemplates = await getAllowedEntityTemplatesForInstances(entityTemplateService, userPermissions);
    const allowedEntityTemplateIds = allowedEntityTemplates.map((entityTemplate) => entityTemplate._id);

    const unauthorizedTemplates = templateIds.filter((templateId) => !allowedEntityTemplateIds.includes(templateId));
    if (unauthorizedTemplates.length > 0) {
        throw new ServiceError(403, 'user not authorized', { metadata: `unauthorized templates ${JSON.stringify(unauthorizedTemplates)}` });
    }
};

export const validateUserCanSearchEntitiesBatch = async (req: Request) => {
    await validateHasPermissionsToEntitiesInTemplates(
        new EntityTemplateService(await getWorkspaceId(req)),
        req.user!,
        Object.keys(req.body.templates),
    );
};

export const validateUserCanSearchEntitiesOfTemplate = async (req: Request) => {
    const { templateId } = req.params;

    await validateHasPermissionsToEntitiesInTemplates(new EntityTemplateService(await getWorkspaceId(req)), req.user!, [templateId]);
};

export const validateUserCanExportEntities = async (req: Request) => {
    const { templates } = req.body;

    await validateHasPermissionsToEntitiesInTemplates(new EntityTemplateService(await getWorkspaceId(req)), req.user!, Object.keys(templates));
};

export type RequestWithPermissionsOfUserId = Request & { permissionsOfUserId: ISubCompactPermissions };

const validateUserPermissionForEntityInstance = async (req: Request, permissionType: PermissionScope) => {
    const instanceId = req.params.id;
    const workspaceId = await getWorkspaceId(req);
    const instancesService = new InstancesService(workspaceId);
    const entityTemplateService = new EntityTemplateService(workspaceId);

    const { templateId } = await instancesService.getEntityInstanceById(instanceId);
    const categoryId = await getCategoryIdFromTemplateId(entityTemplateService, templateId);
    const userPermissions = await UserService.getUserPermissions(req.user!.id);

    // TODO-WORKSPACES
    const hasPermission = userPermissions[workspaceId].instances?.categories.some(
        ({ category, scopes }) => category === categoryId && scopes.includes(permissionType),
    );

    if (!hasPermission) {
        throw new ServiceError(403, `User not authorized, does not have ${permissionType.toLowerCase()} permission on category ${categoryId}`);
    }

    (req as RequestWithPermissionsOfUserId).permissionsOfUserId = userPermissions[workspaceId];
};

export const validateUserCanWriteEntityInstance = async (req: Request) => {
    await validateUserPermissionForEntityInstance(req, PermissionScope.write);
};

export const validateUserCanReadEntityInstance = async (req: Request) => {
    await validateUserPermissionForEntityInstance(req, PermissionScope.read);
};

export const validateUserCanGetExpandedEntity = async (req: Request) => {
    const {
        body: { templateIds },
        permissionsOfUserId,
    } = req as RequestWithPermissionsOfUserId;

    const templatesManager = new TemplatesManager(await getWorkspaceId(req));

    const allAllowedEntityTemplates = (await templatesManager.getAllAllowedEntityTemplates(permissionsOfUserId)).map(
        (entityTemplate) => entityTemplate._id,
    );
    const isAllowedAllTemplates = templateIds.every((templateId) => allAllowedEntityTemplates.includes(templateId));

    if (!isAllowedAllTemplates)
        throw new ServiceError(403, 'user not authorized', { metadata: `unauthorized templates ${JSON.stringify(templateIds)}` });
};

// relationships
const getRelatedCategoriesFromRelationshipInstance = async (
    relationshipsTemplateService: RelationshipsTemplateService,
    entityTemplateService: EntityTemplateService,
    relationshipInstance: IRelationship,
) => {
    const { templateId: relationshipTemplateId } = relationshipInstance;

    const relationshipTemplate = await relationshipsTemplateService.getRelationshipTemplateById(relationshipTemplateId);
    const { sourceEntityId, destinationEntityId } = relationshipTemplate;

    const [{ category: srcCategory }, { category: dstCategory }] = await Promise.all([
        entityTemplateService.getEntityTemplateById(sourceEntityId),
        entityTemplateService.getEntityTemplateById(destinationEntityId),
    ]);

    return lodashUniqby([srcCategory._id, dstCategory._id], (categoryId) => categoryId);
};

export const validateUserCanCreateRelationshipInstance = async (req: Request) => {
    const workspaceId = await getWorkspaceId(req);
    const relatedCategories = await getRelatedCategoriesFromRelationshipInstance(
        new RelationshipsTemplateService(workspaceId),
        new EntityTemplateService(workspaceId),
        req.body.relationshipInstance,
    );

    const userPermissions = await UserService.getUserPermissions(req.user!.id);

    if (!userPermissions[workspaceId].instances?.categories.some(({ category }) => relatedCategories.includes(category))) {
        throw new ServiceError(403, 'user not authorized', { metadata: `user does not have write permission on categories ${relatedCategories}` });
    }
    // return validateAuthorization(req, 'Instances', relatedCategories, 'Write');
};

export const validateUserCanUpdateOrDeleteRelationshipInstance = async (req: Request) => {
    const workspaceId = await getWorkspaceId(req);
    const instancesService = new InstancesService(workspaceId);
    const relationshipInstance = await instancesService.getRelationshipInstanceById(req.params.id);

    const relatedCategories = await getRelatedCategoriesFromRelationshipInstance(
        new RelationshipsTemplateService(workspaceId),
        new EntityTemplateService(workspaceId),
        relationshipInstance,
    );

    const userPermissions = await UserService.getUserPermissions(req.user!.id);

    // TODO-WORKSPACES
    if (!userPermissions[workspaceId].instances?.categories.some(({ category }) => relatedCategories.includes(category))) {
        throw new ServiceError(403, 'user not authorized', { metadata: `user does not have write permission on categories ${relatedCategories}` });
    }
    // return validateAuthorization(req, 'Instances', relatedCategories, 'Write');
};

// rules
export const validateUserCanIgnoreRules = async (req: Request) => {
    const { ignoredRules } = req.body;
    const { user } = req;

    const workspaceId = await getWorkspaceId(req);
    const relationshipsTemplateService = new RelationshipsTemplateService(workspaceId);

    if (!user) throw new Error('req.user is undefined');

    const userPermissions = await UserService.getUserPermissions(user.id);

    // TODO-WORKSPACES
    if (userPermissions[workspaceId].rules?.scope !== PermissionScope.write) {
        throw new ServiceError(403, 'user not authorized', { metadata: 'user does not have write permission on rules' });
    }
    // if (await isRuleManager(user.id)) return;

    const ignoredRulesPopulated: IRule[] = await Promise.all(
        ignoredRules.map((ignoredRule) => relationshipsTemplateService.getRuleById(ignoredRule.ruleId)),
    );

    if (ignoredRulesPopulated.some((rule) => rule.actionOnFail !== 'WARNING')) {
        throw new ServiceError(403, 'a user without rule permissions only ignore "WARNING" rules', {});
    }
};

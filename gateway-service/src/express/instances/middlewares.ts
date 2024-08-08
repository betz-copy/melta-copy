import { Request } from 'express';
import lodashUniqby from 'lodash.uniqby';
import { InstancesService } from '../../externalServices/instanceService';
import { IRelationship } from '../../externalServices/instanceService/interfaces/relationships';
import { EntityTemplateService, IMongoEntityTemplatePopulated } from '../../externalServices/templates/entityTemplateService';
import { RelationshipsTemplateService } from '../../externalServices/templates/relationshipsTemplateService';
import { UserService } from '../../externalServices/userService';
import { PermissionScope } from '../../externalServices/userService/interfaces/permissions';
import { RequestWithPermissionsOfUserId } from '../../utils/authorizer';
import { getWorkspaceId } from '../../utils/express';
import { ServiceError } from '../error';
import { TemplatesManager } from '../templates/manager';
import { IRule } from '../templates/rules/interfaces';

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

    if (!Object.keys(userPermissions[workspaceId].instances?.categories ?? {}).includes(categoryId)) {
        throw new ServiceError(403, 'user not authorized', { metadata: `user does not have write permission on category ${categoryId}` });
    }
};

export const getAllowedEntityTemplatesForInstances = async (
    entityTemplateService: EntityTemplateService,
    userPermissions: RequestWithPermissionsOfUserId['permissionsOfUserId'],
): Promise<IMongoEntityTemplatePopulated[]> => {
    if (!userPermissions.instances) return [];
    const allowedCategories = Object.keys(userPermissions.instances.categories);
    return entityTemplateService.searchEntityTemplates({ categoryIds: allowedCategories });
};

export const validateHasPermissionsToEntitiesInTemplates = async (
    entityTemplateService: EntityTemplateService,
    workspaceId: string,
    user: Express.User,
    templateIds: string[],
) => {
    const userPermissions = await UserService.getUserPermissions(user.id);

    const allowedEntityTemplates = await getAllowedEntityTemplatesForInstances(entityTemplateService, userPermissions[workspaceId]);
    const allowedEntityTemplateIds = allowedEntityTemplates.map((entityTemplate) => entityTemplate._id);

    const unauthorizedTemplates = templateIds.filter((templateId) => !allowedEntityTemplateIds.includes(templateId));
    if (unauthorizedTemplates.length > 0) {
        throw new ServiceError(403, 'user not authorized', { metadata: `unauthorized templates ${JSON.stringify(unauthorizedTemplates)}` });
    }
};

export const validateUserCanSearchEntitiesBatch = async (req: Request) => {
    const workspaceId = await getWorkspaceId(req);

    await validateHasPermissionsToEntitiesInTemplates(
        new EntityTemplateService(workspaceId),
        workspaceId,
        req.user!,
        Object.keys(req.body.templates),
    );
};

export const validateUserCanSearchEntitiesOfTemplate = async (req: Request) => {
    const { templateId } = req.params;
    const workspaceId = await getWorkspaceId(req);

    await validateHasPermissionsToEntitiesInTemplates(new EntityTemplateService(workspaceId), workspaceId, req.user!, [templateId]);
};

export const validateUserCanExportEntities = async (req: Request) => {
    const { templates } = req.body;
    const workspaceId = await getWorkspaceId(req);

    await validateHasPermissionsToEntitiesInTemplates(new EntityTemplateService(workspaceId), workspaceId, req.user!, Object.keys(templates));
};

const validateUserPermissionForEntityInstance = async (req: Request, permissionType: PermissionScope) => {
    const instanceId = req.params.id;
    const workspaceId = await getWorkspaceId(req);
    const instancesService = new InstancesService(workspaceId);
    const entityTemplateService = new EntityTemplateService(workspaceId);

    const { templateId } = await instancesService.getEntityInstanceById(instanceId);
    const categoryId = await getCategoryIdFromTemplateId(entityTemplateService, templateId);
    const userPermissions = await UserService.getUserPermissions(req.user!.id);

    if (
        !Object.entries(userPermissions[workspaceId].instances?.categories ?? {}).some(
            ([category, { scope }]) => category === categoryId && (scope === permissionType || scope === PermissionScope.write),
        )
    ) {
        throw new ServiceError(403, `user not authorized, does not have ${permissionType} permission on category ${categoryId}`);
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
    req.body.userId = req.user!.id;

    const templatesManager = new TemplatesManager(await getWorkspaceId(req));

    const allAllowedEntityTemplates = (await templatesManager.getAllAllowedEntityTemplates(permissionsOfUserId)).map(
        (entityTemplate) => entityTemplate._id,
    );
    const isAllowedAllTemplates = (templateIds as string[]).every((templateId) => allAllowedEntityTemplates.includes(templateId));

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

    if (
        !Object.entries(userPermissions[workspaceId].instances?.categories ?? {}).some(
            ([categoryId, { scope }]) => relatedCategories.includes(categoryId) && scope === PermissionScope.write,
        )
    ) {
        throw new ServiceError(403, `user not authorized, does not have ${PermissionScope.write} permission on categories ${relatedCategories}`);
    }
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

    if (
        !Object.entries(userPermissions[workspaceId].instances?.categories ?? {}).some(
            ([categoryId, { scope }]) => relatedCategories.includes(categoryId) && scope === PermissionScope.write,
        )
    ) {
        throw new ServiceError(403, `user not authorized, does not have ${PermissionScope.write} permission on categories ${relatedCategories}`);
    }
};

// rules
export const validateUserCanIgnoreRules = async (req: Request) => {
    const { ignoredRules } = req.body;
    const { user } = req;

    const workspaceId = await getWorkspaceId(req);
    const relationshipsTemplateService = new RelationshipsTemplateService(workspaceId);

    if (!user) throw new Error('req.user is undefined');

    const userPermissions = await UserService.getUserPermissions(user.id);

    if (userPermissions[workspaceId].rules?.scope !== PermissionScope.write) {
        throw new ServiceError(403, 'user not authorized', { metadata: 'user does not have write permission on rules' });
    }

    const ignoredRulesPopulated: IRule[] = await Promise.all(
        ignoredRules.map((ignoredRule) => relationshipsTemplateService.getRuleById(ignoredRule.ruleId)),
    );

    if (ignoredRulesPopulated.some((rule) => rule.actionOnFail !== 'WARNING')) {
        throw new ServiceError(403, 'a user without rule permissions only ignore "WARNING" rules', {});
    }
};

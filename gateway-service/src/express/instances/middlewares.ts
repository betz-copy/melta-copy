import { Request } from 'express';
import lodashUniqby from 'lodash.uniqby';
import { EntityTemplateService } from '../../externalServices/entityTemplateService';
import { IRelationship } from '../../externalServices/instanceService/interfaces/relationships';
import { InstancesService } from '../../externalServices/instanceService';
import { RelationshipsTemplateService } from '../../externalServices/relationshipsTemplateService';
import { ServiceError } from '../error';
import { TemplatesManager } from '../templates/manager';
import { IRule } from '../templates/rules/interfaces';
import { getDbName } from '../../utils/express';
import { PermissionScope } from '../../externalServices/userService/interfaces/permissions';
import { Authorizer } from '../../utils/authorizer';
import { UserService } from '../../externalServices/userService';

// entities
const getCategoryIdFromTemplateId = async (entityTemplateService: EntityTemplateService, templateId: string) => {
    const template = await entityTemplateService.getEntityTemplateById(templateId);
    const { category } = template;

    return category._id;
};

export const validateUserCanCreateEntityInstance = async (req: Request) => {
    const { templateId } = req.body;

    const entityTemplateService = new EntityTemplateService(await getDbName(req));

    const categoryId = await getCategoryIdFromTemplateId(entityTemplateService, templateId);

    return validateAuthorization(req, 'Instances', [categoryId], 'Write');
};

export const getAllowedEntityTemplatesForInstances = (
    entityTemplateService: EntityTemplateService,
    userPermissions: Omit<IPermissionsOfUser, 'user'>,
) => {
    const allowedCategories = userPermissions.instancesPermissions.map((permission) => permission.category);
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
    await validateHasPermissionsToEntitiesInTemplates(new EntityTemplateService(await getDbName(req)), req.user!, Object.keys(req.body.templates));
};

export const validateUserCanSearchEntitiesOfTemplate = async (req: Request) => {
    const { templateId } = req.params;

    await validateHasPermissionsToEntitiesInTemplates(new EntityTemplateService(await getDbName(req)), req.user!, [templateId]);
};

export const validateUserCanExportEntities = async (req: Request) => {
    const { templates } = req.body;

    await validateHasPermissionsToEntitiesInTemplates(new EntityTemplateService(await getDbName(req)), req.user!, Object.keys(templates));
};

export type RequestWithPermissionsOfUserId = Request & { permissionsOfUserId: Omit<IPermissionsOfUser, 'user'> };

const validateUserPermissionForEntityInstance = async (req: Request, permissionType: PermissionScope) => {
    const instanceId = req.params.id;
    const dbName = await getDbName(req);
    const instancesService = new InstancesService(dbName);
    const entityTemplateService = new EntityTemplateService(dbName);

    const { templateId } = await instancesService.getEntityInstanceById(instanceId);
    const categoryId = await getCategoryIdFromTemplateId(entityTemplateService, templateId);
    const permissionsArrOfUser = await getPermissions({ userId: req.user!.id });
    const permissionsOfUserId = PermissionsManager.buildPermissionsOfUserId(permissionsArrOfUser);

    const hasPermission = permissionsOfUserId.instancesPermissions.some(
        ({ category, scopes }) => category === categoryId && scopes.includes(permissionType),
    );

    if (!hasPermission) {
        throw new ServiceError(403, `User not authorized, does not have ${permissionType.toLowerCase()} permission on category ${categoryId}`);
    }

    (req as RequestWithPermissionsOfUserId).permissionsOfUserId = permissionsOfUserId;
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

    const templatesManager = new TemplatesManager(await getDbName(req));

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
    const dbName = await getDbName(req);
    const relatedCategories = await getRelatedCategoriesFromRelationshipInstance(
        new RelationshipsTemplateService(dbName),
        new EntityTemplateService(dbName),
        req.body.relationshipInstance,
    );

    return validateAuthorization(req, 'Instances', relatedCategories, 'Write');
};

export const validateUserCanUpdateOrDeleteRelationshipInstance = async (req: Request) => {
    const dbName = await getDbName(req);
    const instancesService = new InstancesService(dbName);
    const relationshipInstance = await instancesService.getRelationshipInstanceById(req.params.id);

    const relatedCategories = await getRelatedCategoriesFromRelationshipInstance(
        new RelationshipsTemplateService(dbName),
        new EntityTemplateService(dbName),
        relationshipInstance,
    );

    return validateAuthorization(req, 'Instances', relatedCategories, 'Write');
};

// rules
export const validateUserCanIgnoreRules = async (req: Request) => {
    const { ignoredRules } = req.body;
    const { user } = req;

    const dbName = await getDbName(req);
    const relationshipsTemplateService = new RelationshipsTemplateService(dbName);
    const authorizer = new Authorizer(dbName, user?.id);

    if (!user) throw new Error('req.user is undefined');
    if (await isRuleManager(user.id)) return;

    const ignoredRulesPopulated: IRule[] = await Promise.all(
        ignoredRules.map((ignoredRule) => relationshipsTemplateService.getRuleById(ignoredRule.ruleId)),
    );

    if (ignoredRulesPopulated.some((rule) => rule.actionOnFail !== 'WARNING')) {
        throw new ServiceError(403, 'a user without rule permissions only ignore "WARNING" rules', {});
    }
};

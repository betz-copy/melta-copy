import { Request } from 'express';
import lodashUniqby from 'lodash.uniqby';
import { EntityTemplateManagerService, ISearchEntityTemplatesBody } from '../../externalServices/templates/entityTemplateService';
import { IRelationship } from '../../externalServices/instanceService/interfaces/relationships';
import { InstanceManagerService } from '../../externalServices/instanceService';
import { Scope, getPermissions, isRuleManager } from '../../externalServices/permissionsService';
import {
    ISearchRelationshipTemplatesBody,
    ISearchRulesBody,
    RelationshipsTemplateManagerService,
} from '../../externalServices/templates/relationshipsTemplateService';
import { ServiceError } from '../error';
import { IPermissionsOfUser } from '../permissions/interfaces';
import PermissionsManager from '../permissions/manager';
import { validateAuthorization } from '../permissions/validateAuthorizationMiddleware';
import { TemplatesManager } from '../templates/manager';
import { IRule } from '../templates/rules/interfaces';

// entities
const getCategoryIdFromTemplateId = async (templateId: string) => {
    const template = await EntityTemplateManagerService.getEntityTemplateById(templateId);
    const { category } = template;

    return category._id;
};

export const validateUserCanCreateEntityInstance = async (req: Request) => {
    const { templateId } = req.body;

    const categoryId = await getCategoryIdFromTemplateId(templateId);

    return validateAuthorization(req, 'Instances', [categoryId], 'Write');
};

export const getAllowedEntityTemplatesForInstances = (userPermissions: Omit<IPermissionsOfUser, 'user'>) => {
    const allowedCategories = userPermissions.instancesPermissions.map((permission) => permission.category);
    return EntityTemplateManagerService.searchEntityTemplates({ categoryIds: allowedCategories });
};

export const validateHasPermissionsToEntitiesInTemplates = async (user: Express.User, templateIds: string[]) => {
    const userPermissions = await PermissionsManager.getPermissionsOfUserId(user.id);

    const allowedEntityTemplates = await getAllowedEntityTemplatesForInstances(userPermissions);
    const allowedEntityTemplateIds = allowedEntityTemplates.map((entityTemplate) => entityTemplate._id);

    const unauthorizedTemplates = templateIds.filter((templateId) => !allowedEntityTemplateIds.includes(templateId));
    if (unauthorizedTemplates.length > 0) {
        throw new ServiceError(403, 'user not authorized', { metadata: `unauthorized templates ${JSON.stringify(unauthorizedTemplates)}` });
    }
};

export const validateUserCanSearchEntitiesBatch = async (req: Request) => {
    await validateHasPermissionsToEntitiesInTemplates(req.user!, Object.keys(req.body.templates));
};

export const validateUserCanSearchEntitiesOfTemplate = async (req: Request) => {
    const { templateId } = req.params;

    await validateHasPermissionsToEntitiesInTemplates(req.user!, [templateId]);
};

export const validateUserCanExportEntities = async (req: Request) => {
    const { templates } = req.body;

    await validateHasPermissionsToEntitiesInTemplates(req.user!, Object.keys(templates));
};

export type RequestWithPermissionsOfUserId = Request & { permissionsOfUserId: Omit<IPermissionsOfUser, 'user'> };

export interface RequestWithSearchEntityTemplateBody extends RequestWithPermissionsOfUserId {
    searchQuery: ISearchEntityTemplatesBody;
}

export interface RequestWithSearchRelationshipTemplateBody extends RequestWithPermissionsOfUserId {
    searchBody: ISearchRelationshipTemplatesBody;
}

export interface RequestWithSearchRuleTemplateBody extends RequestWithPermissionsOfUserId {
    searchBody: ISearchRulesBody;
}

const validateUserPermissionForEntityInstance = async (req: Request, permissionType: Scope) => {
    const instanceId = req.params.id;
    const { templateId } = await InstanceManagerService.getEntityInstanceById(instanceId);
    const categoryId = await getCategoryIdFromTemplateId(templateId);
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
    await validateUserPermissionForEntityInstance(req, 'Write');
};

export const validateUserCanReadEntityInstance = async (req: Request) => {
    await validateUserPermissionForEntityInstance(req, 'Read');
};

export const validateUserCanGetExpandedEntity = async (req: Request) => {
    const {
        body: { templateIds },
        permissionsOfUserId,
    } = req as RequestWithPermissionsOfUserId;

    const allAllowedEntityTemplates = (await TemplatesManager.getAllAllowedEntityTemplates(permissionsOfUserId)).map(
        (entityTemplate) => entityTemplate._id,
    );
    const isAllowedAllTemplates = templateIds.every((templateId) => allAllowedEntityTemplates.includes(templateId));

    if (!isAllowedAllTemplates)
        throw new ServiceError(403, 'user not authorized', { metadata: `unauthorized templates ${JSON.stringify(templateIds)}` });
};

// relationships
const getRelatedCategoriesFromRelationshipInstance = async (relationshipInstance: IRelationship) => {
    const { templateId: relationshipTemplateId } = relationshipInstance;

    const relationshipTemplate = await RelationshipsTemplateManagerService.getRelationshipTemplateById(relationshipTemplateId);
    const { sourceEntityId, destinationEntityId } = relationshipTemplate;

    const { category: srcCategory } = await EntityTemplateManagerService.getEntityTemplateById(sourceEntityId);
    const { category: dstCategory } = await EntityTemplateManagerService.getEntityTemplateById(destinationEntityId);

    return lodashUniqby([srcCategory._id, dstCategory._id], (categoryId) => categoryId);
};

export const validateUserCanCreateRelationshipInstance = async (req: Request) => {
    const relatedCategories = await getRelatedCategoriesFromRelationshipInstance(req.body.relationshipInstance);

    return validateAuthorization(req, 'Instances', relatedCategories, 'Write');
};

export const validateUserCanUpdateOrDeleteRelationshipInstance = async (req: Request) => {
    const relationshipInstance = await InstanceManagerService.getRelationshipInstanceById(req.params.id);

    const relatedCategories = await getRelatedCategoriesFromRelationshipInstance(relationshipInstance);

    return validateAuthorization(req, 'Instances', relatedCategories, 'Write');
};

// rules
export const validateUserCanIgnoreRules = async (req: Request) => {
    const { ignoredRules } = req.body;
    const { user } = req;

    if (!user) throw new Error('req.user is undefined');
    if (await isRuleManager(user.id)) return;

    const ignoredRulesPopulated: IRule[] = await Promise.all(
        ignoredRules.map((ignoredRule) => RelationshipsTemplateManagerService.getRuleById(ignoredRule.ruleId)),
    );

    if (ignoredRulesPopulated.some((rule) => rule.actionOnFail !== 'WARNING')) {
        throw new ServiceError(403, 'a user without rule permissions only ignore "WARNING" rules', {});
    }
};

import { Request } from 'express';
import * as lodashUniqby from 'lodash.uniqby';
import { EntityTemplateManagerService } from '../../externalServices/entityTemplateManager';
import { InstanceManagerService, IRelationship } from '../../externalServices/instanceManager';
import { isRuleManager } from '../../externalServices/permissionsApi';
import { RelationshipsTemplateManagerService } from '../../externalServices/relationshipsTemplateManager';
import { ShragaUser } from '../../utils/express/passport';
import { ServiceError } from '../error';
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

    return validateAuthorization(req, 'Instances', [categoryId]);
};

export const validateHasPermissionsToEntitiesInTemplates = async (user: ShragaUser, templateIds: string[]) => {
    const allowedEntityTemplates = (await TemplatesManager.getAllowedEntitiesTemplates(user.id)).map((entityTemplate) => entityTemplate._id);
    const unauthorizedTemplates = templateIds.filter((templateId) => !allowedEntityTemplates.includes(templateId));

    if (unauthorizedTemplates.length > 0) {
        throw new ServiceError(403, 'user not authorized', { metadata: `unauthorized templates ${JSON.stringify(unauthorizedTemplates)}` });
    }
};

export const validateUserCanSearchEntityInstances = async (req: Request) => {
    const { templateIds } = req.query as { templateIds: string[] };

    await validateHasPermissionsToEntitiesInTemplates(req.user!, templateIds);
};

export const validateUserCanExportEntityInstances = async (req: Request) => {
    const { templateIds } = req.body;

    await validateHasPermissionsToEntitiesInTemplates(req.user!, templateIds);
};

export const validateUserCanUpdateGetOrDeleteEntityInstance = async (req: Request) => {
    const instanceId = req.params.id;

    const { templateId } = await InstanceManagerService.getEntityInstanceById(instanceId);

    const categoryId = await getCategoryIdFromTemplateId(templateId);

    return validateAuthorization(req, 'Instances', [categoryId]);
};

export const validateUserCanGetExpandedEntity = async (req: Request) => {
    const { templateIds } = req.body;
    const allAllowedEntityTemplates = (await TemplatesManager.getAllAllowedEntityTemplates(req.user?.id!)).map(
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

    return lodashUniqby([srcCategory._id, dstCategory._id]);
};

export const validateUserCanCreateRelationshipInstance = async (req: Request) => {
    const relatedCategories = await getRelatedCategoriesFromRelationshipInstance(req.body.relationshipInstance);

    return validateAuthorization(req, 'Instances', relatedCategories);
};

export const validateUserCanUpdateOrDeleteRelationshipInstance = async (req: Request) => {
    const relationshipInstance = await InstanceManagerService.getRelationshipInstanceById(req.params.id);

    const relatedCategories = await getRelatedCategoriesFromRelationshipInstance(relationshipInstance);

    return validateAuthorization(req, 'Instances', relatedCategories);
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

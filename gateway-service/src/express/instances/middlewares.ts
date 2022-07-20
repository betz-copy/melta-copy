import { Request } from 'express';
import * as lodashUniqby from 'lodash.uniqby';
import { EntityTemplateManagerService } from '../../externalServices/entityTemplateManager';
import { InstanceManagerService, IRelationship } from '../../externalServices/instanceManager';
import { RelationshipsTemplateManagerService } from '../../externalServices/relationshipsTemplateManager';
import { validateAuthorization } from '../permissions/validateAuthorizationMiddleware';

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

export const validateUserCanSearchEntityInstances = async (req: Request) => {
    const categoryId = await getCategoryIdFromTemplateId(req.query.templateId as string);

    return validateAuthorization(req, 'Instances', [categoryId]);
};

export const validateUserCanUpdateGetOrDeleteEntityInstance = async (req: Request) => {
    const instanceId = req.params.id;

    const { templateId } = await InstanceManagerService.getEntityInstanceById(instanceId);

    const categoryId = await getCategoryIdFromTemplateId(templateId);

    return validateAuthorization(req, 'Instances', [categoryId]);
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
    const relatedCategories = await getRelatedCategoriesFromRelationshipInstance(req.body);

    return validateAuthorization(req, 'Instances', relatedCategories);
};

export const validateUserCanUpdateOrDeleteRelationshipInstance = async (req: Request) => {
    const relationshipInstance = await InstanceManagerService.getRelationshipInstanceById(req.params.id);

    const relatedCategories = await getRelatedCategoriesFromRelationshipInstance(relationshipInstance);

    return validateAuthorization(req, 'Instances', relatedCategories);
};

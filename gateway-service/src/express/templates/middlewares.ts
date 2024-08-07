import { Request } from 'express';
import lodashUniqby from 'lodash.uniqby';
import { EntityTemplateManagerService } from '../../externalServices/templates/entityTemplateService';
import { IRelationshipTemplate, RelationshipsTemplateManagerService } from '../../externalServices/templates/relationshipsTemplateService';
import { validateAuthorization } from '../permissions/validateAuthorizationMiddleware';

export const validateUserCanCreateEntityTemplateUnderCategory = (req: Request) => {
    const { category } = req.body;

    return validateAuthorization(req, 'Templates', [category]);
};

export const validateUserCanUpdateOrDeleteEntityTemplate = async (req: Request) => {
    const templateId = req.params.id;

    const { category } = await EntityTemplateManagerService.getEntityTemplateById(templateId);

    return validateAuthorization(req, 'Templates', [category._id]);
};

export const getRelatedCategoriesFromRelationshipTemplate = async (relationshipTemplate: IRelationshipTemplate) => {
    const { sourceEntityId, destinationEntityId } = relationshipTemplate;

    const { category: srcCategory } = await EntityTemplateManagerService.getEntityTemplateById(sourceEntityId);
    const { category: dstCategory } = await EntityTemplateManagerService.getEntityTemplateById(destinationEntityId);

    return lodashUniqby([srcCategory._id, dstCategory._id], '_id');
};

export const validateUserCanCreateRelationshipTemplateUnderCategory = async (req: Request) => {
    const relatedCategories = await getRelatedCategoriesFromRelationshipTemplate(req.body);

    return validateAuthorization(req, 'Templates', relatedCategories);
};

export const validateUserCanUpdateOrDeleteRelationshipTemplate = async (req: Request) => {
    const relationshipTemplate = await RelationshipsTemplateManagerService.getRelationshipTemplateById(req.params.id);

    const relatedCategories = await getRelatedCategoriesFromRelationshipTemplate(relationshipTemplate);

    return validateAuthorization(req, 'Templates', relatedCategories);
};

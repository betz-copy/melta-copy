import { Request } from 'express';
import lodashUniqby from 'lodash.uniqby';
import { EntityTemplateService } from '../../externalServices/entityTemplateService';
import { IRelationshipTemplate, RelationshipsTemplateService } from '../../externalServices/relationshipsTemplateService';
import { validateAuthorization } from '../permissions/validateAuthorizationMiddleware';

export const validateUserCanCreateEntityTemplateUnderCategory = (req: Request) => {
    const { category } = req.body;

    return validateAuthorization(req, 'Templates', [category]);
};

export const validateUserCanUpdateOrDeleteEntityTemplate = async (req: Request) => {
    const templateId = req.params.id;

    const { category } = await EntityTemplateService.getEntityTemplateById(templateId);

    return validateAuthorization(req, 'Templates', [category._id]);
};

export const getRelatedCategoriesFromRelationshipTemplate = async (relationshipTemplate: IRelationshipTemplate) => {
    const { sourceEntityId, destinationEntityId } = relationshipTemplate;

    const { category: srcCategory } = await EntityTemplateService.getEntityTemplateById(sourceEntityId);
    const { category: dstCategory } = await EntityTemplateService.getEntityTemplateById(destinationEntityId);

    return lodashUniqby([srcCategory._id, dstCategory._id], '_id');
};

export const validateUserCanCreateRelationshipTemplateUnderCategory = async (req: Request) => {
    const relatedCategories = await getRelatedCategoriesFromRelationshipTemplate(req.body);

    return validateAuthorization(req, 'Templates', relatedCategories);
};

export const validateUserCanUpdateOrDeleteRelationshipTemplate = async (req: Request) => {
    const relationshipTemplate = await RelationshipsTemplateService.getRelationshipTemplateById(req.params.id);

    const relatedCategories = await getRelatedCategoriesFromRelationshipTemplate(relationshipTemplate);

    return validateAuthorization(req, 'Templates', relatedCategories);
};

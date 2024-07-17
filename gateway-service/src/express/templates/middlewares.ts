import { Request } from 'express';
import lodashUniqby from 'lodash.uniqby';
import { EntityTemplateService } from '../../externalServices/entityTemplateService';
import { IRelationshipTemplate, RelationshipsTemplateService } from '../../externalServices/relationshipsTemplateService';
import { Authorizer } from '../../utils/authorizer';
import { getWorkspaceId } from '../../utils/express';

export const validateUserCanCreateEntityTemplateUnderCategory = (req: Request) => {
    const { category } = req.body;

    return validateAuthorization(req, 'Templates', [category]);
};

export const validateUserCanUpdateOrDeleteEntityTemplate = async (req: Request) => {
    const templateId = req.params.id;
    const entityTemplateService = new EntityTemplateService(await getWorkspaceId(req));

    const { category } = await entityTemplateService.getEntityTemplateById(templateId);

    return validateAuthorization(req, 'Templates', [category._id]);
};

export const getRelatedCategoriesFromRelationshipTemplate = async (
    entityTemplateService: EntityTemplateService,
    relationshipTemplate: IRelationshipTemplate,
) => {
    const { sourceEntityId, destinationEntityId } = relationshipTemplate;

    const [{ category: srcCategory }, { category: dstCategory }] = await Promise.all([
        entityTemplateService.getEntityTemplateById(sourceEntityId),
        entityTemplateService.getEntityTemplateById(destinationEntityId),
    ]);

    return lodashUniqby([srcCategory._id, dstCategory._id], '_id');
};

export const validateUserCanCreateRelationshipTemplateUnderCategory = async (req: Request) => {
    const entityTemplateService = new EntityTemplateService(await getWorkspaceId(req));
    const relatedCategories = await getRelatedCategoriesFromRelationshipTemplate(entityTemplateService, req.body);

    return validateAuthorization(req, 'Templates', relatedCategories);
};

export const validateUserCanUpdateOrDeleteRelationshipTemplate = async (req: Request) => {
    const workspaceId = await getWorkspaceId(req);
    const relationshipsTemplateService = new RelationshipsTemplateService(workspaceId);
    const entityTemplateService = new EntityTemplateService(workspaceId);

    const relationshipTemplate = await relationshipsTemplateService.getRelationshipTemplateById(req.params.id);
    const relatedCategories = await getRelatedCategoriesFromRelationshipTemplate(entityTemplateService, relationshipTemplate);

    return validateAuthorization(req, 'Templates', relatedCategories);
};

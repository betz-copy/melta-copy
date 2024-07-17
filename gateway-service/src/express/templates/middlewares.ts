import { Request } from 'express';
import lodashUniqby from 'lodash.uniqby';
import { EntityTemplateService } from '../../externalServices/entityTemplateService';
import { IRelationshipTemplate, RelationshipsTemplateService } from '../../externalServices/relationshipsTemplateService';
import { UserService } from '../../externalServices/userService';
import { PermissionScope } from '../../externalServices/userService/interfaces/permissions';
import { getWorkspaceId } from '../../utils/express';
import { ServiceError } from '../error';

export const validateUserCanCreateEntityTemplateUnderCategory = async (req: Request) => {
    const { category } = req.body;

    const [workspaceId, userPermissions] = await Promise.all([getWorkspaceId(req), UserService.getUserPermissions(req.user!.id)]);

    if (!Object.keys(userPermissions[workspaceId].instances?.categories ?? {}).includes(category)) {
        throw new ServiceError(403, 'user not authorized', { metadata: `user does not have write permission on category ${category}` });
    }
};

export const validateUserCanUpdateOrDeleteEntityTemplate = async (req: Request) => {
    const templateId = req.params.id;
    const workspaceId = await getWorkspaceId(req);
    const entityTemplateService = new EntityTemplateService(workspaceId);

    const { category } = await entityTemplateService.getEntityTemplateById(templateId);

    const userPermissions = await UserService.getUserPermissions(req.user!.id);

    if (!Object.keys(userPermissions[workspaceId].instances?.categories ?? {}).includes(category._id)) {
        throw new ServiceError(403, 'user not authorized', { metadata: `user does not have write permission on category ${category}` });
    }
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
    const workspaceId = await getWorkspaceId(req);
    const entityTemplateService = new EntityTemplateService(workspaceId);
    const relatedCategories = await getRelatedCategoriesFromRelationshipTemplate(entityTemplateService, req.body);

    const userPermissions = await UserService.getUserPermissions(req.user!.id);

    if (
        !Object.entries(userPermissions[workspaceId].instances?.categories ?? {}).some(
            ([categoryId, { scope }]) => relatedCategories.includes(categoryId) && scope !== PermissionScope.write,
        )
    ) {
        throw new ServiceError(403, `user not authorized, does not have ${PermissionScope.write} permission on categories ${relatedCategories}`);
    }
};

export const validateUserCanUpdateOrDeleteRelationshipTemplate = async (req: Request) => {
    const workspaceId = await getWorkspaceId(req);
    const relationshipsTemplateService = new RelationshipsTemplateService(workspaceId);
    const entityTemplateService = new EntityTemplateService(workspaceId);

    const relationshipTemplate = await relationshipsTemplateService.getRelationshipTemplateById(req.params.id);
    const relatedCategories = await getRelatedCategoriesFromRelationshipTemplate(entityTemplateService, relationshipTemplate);

    const userPermissions = await UserService.getUserPermissions(req.user!.id);

    if (
        !Object.entries(userPermissions[workspaceId].instances?.categories ?? {}).some(
            ([categoryId, { scope }]) => relatedCategories.includes(categoryId) && scope !== PermissionScope.write,
        )
    ) {
        throw new ServiceError(403, `user not authorized, does not have ${PermissionScope.write} permission on categories ${relatedCategories}`);
    }
};

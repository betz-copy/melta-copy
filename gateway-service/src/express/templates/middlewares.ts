import { Request } from 'express';
import lodashUniqby from 'lodash.uniqby';
import { EntityTemplateService } from '../../externalServices/templates/entityTemplateService';
import { IRelationshipTemplate, RelationshipsTemplateService } from '../../externalServices/templates/relationshipsTemplateService';
import { UserService } from '../../externalServices/userService';
import { PermissionScope } from '../../externalServices/userService/interfaces/permissions';
import DefaultController from '../../utils/express/controller';
import { ServiceError } from '../error';

export class TemplatesValidator extends DefaultController {
    private entityTemplateService: EntityTemplateService;

    private relationshipsTemplateService: RelationshipsTemplateService;

    constructor(private workspaceId: string) {
        super(null);
        this.entityTemplateService = new EntityTemplateService(workspaceId);
        this.relationshipsTemplateService = new RelationshipsTemplateService(workspaceId);
    }

    async validateUserCanCreateEntityTemplateUnderCategory(req: Request) {
        const { category } = req.body;

        const userPermissions = await UserService.getUserPermissions(req.user!.id);

        if (!Object.keys(userPermissions[this.workspaceId].instances?.categories ?? {}).includes(category)) {
            throw new ServiceError(403, 'user not authorized', { metadata: `user does not have write permission on category ${category}` });
        }
    }

    async validateUserCanUpdateOrDeleteEntityTemplate(req: Request) {
        const templateId = req.params.id;

        const [{ category }, userPermissions] = await Promise.all([
            this.entityTemplateService.getEntityTemplateById(templateId),
            await UserService.getUserPermissions(req.user!.id),
        ]);

        if (!Object.keys(userPermissions[this.workspaceId].instances?.categories ?? {}).includes(category._id)) {
            throw new ServiceError(403, 'user not authorized', { metadata: `user does not have write permission on category ${category}` });
        }
    }

    async getRelatedCategoriesFromRelationshipTemplate(relationshipTemplate: IRelationshipTemplate) {
        const { sourceEntityId, destinationEntityId } = relationshipTemplate;

        const [{ category: srcCategory }, { category: dstCategory }] = await Promise.all([
            this.entityTemplateService.getEntityTemplateById(sourceEntityId),
            this.entityTemplateService.getEntityTemplateById(destinationEntityId),
        ]);

        return lodashUniqby([srcCategory._id, dstCategory._id], '_id');
    }

    async validateUserCanCreateRelationshipTemplateUnderCategory(req: Request) {
        const [relatedCategories, userPermissions] = await Promise.all([
            this.getRelatedCategoriesFromRelationshipTemplate(req.body),
            UserService.getUserPermissions(req.user!.id),
        ]);

        if (
            !Object.entries(userPermissions[this.workspaceId].instances?.categories ?? {}).some(
                ([categoryId, { scope }]) => relatedCategories.includes(categoryId) && scope === PermissionScope.write,
            )
        ) {
            throw new ServiceError(403, `user not authorized, does not have ${PermissionScope.write} permission on categories ${relatedCategories}`);
        }
    }

    async validateUserCanUpdateOrDeleteRelationshipTemplate(req: Request) {
        const relationshipTemplate = await this.relationshipsTemplateService.getRelationshipTemplateById(req.params.id);
        const relatedCategories = await this.getRelatedCategoriesFromRelationshipTemplate(relationshipTemplate);

        const userPermissions = await UserService.getUserPermissions(req.user!.id);

        if (
            !Object.entries(userPermissions[this.workspaceId].instances?.categories ?? {}).some(
                ([categoryId, { scope }]) => relatedCategories.includes(categoryId) && scope === PermissionScope.write,
            )
        ) {
            throw new ServiceError(403, `user not authorized, does not have ${PermissionScope.write} permission on categories ${relatedCategories}`);
        }
    }
}

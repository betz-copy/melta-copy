import { Request } from 'express';
import lodashUniqby from 'lodash.uniqby';
import { EntityTemplateService } from '../../externalServices/templates/entityTemplateService';
import { IRelationshipTemplate, RelationshipsTemplateService } from '../../externalServices/templates/relationshipsTemplateService';
import { PermissionScope } from '../../externalServices/userService/interfaces/permissions';
import { Authorizer } from '../../utils/authorizer';
import DefaultController from '../../utils/express/controller';
import { ServiceError } from '../error';

export class TemplatesValidator extends DefaultController {
    private entityTemplateService: EntityTemplateService;

    private relationshipsTemplateService: RelationshipsTemplateService;

    private authorizer: Authorizer;

    constructor(workspaceId: string) {
        super(null);
        this.entityTemplateService = new EntityTemplateService(workspaceId);
        this.relationshipsTemplateService = new RelationshipsTemplateService(workspaceId);
        this.authorizer = new Authorizer(workspaceId, '');
    }

    async validateUserCanCreateEntityTemplateUnderCategory(req: Request) {
        const { category } = req.body;

        const userPermissions = await this.authorizer.getWorkspacePermissions(req.user!.id);

        console.log(userPermissions);

        if (!userPermissions.admin?.scope && !Object.keys(userPermissions.instances?.categories ?? {}).includes(category)) {
            throw new ServiceError(403, 'user not authorized', { metadata: `user does not have write permission on category ${category}` });
        }
    }

    async validateUserCanUpdateOrDeleteEntityTemplate(req: Request) {
        const templateId = req.params.id;

        const [{ category }, userPermissions] = await Promise.all([
            this.entityTemplateService.getEntityTemplateById(templateId),
            this.authorizer.getWorkspacePermissions(req.user!.id),
        ]);

        if (!userPermissions.admin?.scope && !Object.keys(userPermissions.instances?.categories ?? {}).includes(category._id)) {
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
            this.authorizer.getWorkspacePermissions(req.user!.id),
        ]);

        if (
            !userPermissions.admin?.scope &&
            !Object.entries(userPermissions.instances?.categories ?? {}).some(
                ([categoryId, { scope }]) => relatedCategories.includes(categoryId) && scope === PermissionScope.write,
            )
        ) {
            throw new ServiceError(403, `user not authorized, does not have ${PermissionScope.write} permission on categories ${relatedCategories}`);
        }
    }

    async validateUserCanUpdateOrDeleteRelationshipTemplate(req: Request) {
        const relationshipTemplate = await this.relationshipsTemplateService.getRelationshipTemplateById(req.params.id);
        const relatedCategories = await this.getRelatedCategoriesFromRelationshipTemplate(relationshipTemplate);

        const userPermissions = await this.authorizer.getWorkspacePermissions(req.user!.id);

        if (
            !userPermissions.admin?.scope &&
            !Object.entries(userPermissions.instances?.categories ?? {}).some(
                ([categoryId, { scope }]) => relatedCategories.includes(categoryId) && scope === PermissionScope.write,
            )
        ) {
            throw new ServiceError(403, `user not authorized, does not have ${PermissionScope.write} permission on categories ${relatedCategories}`);
        }
    }
}

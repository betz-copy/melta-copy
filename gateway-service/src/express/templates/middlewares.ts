import { Request } from 'express';
import lodashUniqby from 'lodash.uniqby';
import { EntityTemplateService } from '../../externalServices/templates/entityTemplateService';
import { IRelationshipTemplate, RelationshipsTemplateService } from '../../externalServices/templates/relationshipsTemplateService';
import { PermissionScope } from '../../externalServices/userService/interfaces/permissions';
import { Authorizer } from '../../utils/authorizer';
import DefaultController from '../../utils/express/controller';
import { ForbiddenError } from '../error';

export class TemplatesValidator extends DefaultController {
    private entityTemplateService: EntityTemplateService;

    private relationshipsTemplateService: RelationshipsTemplateService;

    private authorizer: Authorizer;

    constructor(workspaceId: string) {
        super(null);
        this.entityTemplateService = new EntityTemplateService(workspaceId);
        this.relationshipsTemplateService = new RelationshipsTemplateService(workspaceId);
        this.authorizer = new Authorizer(workspaceId);
    }

    async validateUserCanCreateEntityTemplateUnderCategory(req: Request) {
        const { category } = req.body;

        const userPermissions = await this.authorizer.getWorkspacePermissions(req.user!.id);

        if (!userPermissions.admin?.scope && !Object.keys(userPermissions.instances?.categories ?? {}).includes(category)) {
            throw new ForbiddenError('user not authorized', { metadata: `user does not have write permission on category ${category}` });
        }
    }

    async validateUserCanUpdateOrDeleteEntityTemplate(req: Request) {
        const templateId = req.params.id;

        const [entityTemplate, userPermissions] = await Promise.all([
            this.entityTemplateService.getEntityTemplateById(templateId),
            this.authorizer.getWorkspacePermissions(req.user!.id),
        ]);

        if (
            !userPermissions.admin?.scope &&
            userPermissions.instances?.categories[entityTemplate.category._id]?.scope !== PermissionScope.write &&
            userPermissions.instances?.categories[entityTemplate.category._id]?.entityTemplates[templateId]?.scope !== PermissionScope.write
        )
            throw new ForbiddenError('user not authorized', {
                metadata: `user does not have write permission on entity ${entityTemplate}`,
            });
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
            throw new ForbiddenError(`user not authorized, does not have ${PermissionScope.write} permission on categories ${relatedCategories}`);
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
            throw new ForbiddenError(`user not authorized, does not have ${PermissionScope.write} permission on categories ${relatedCategories}`);
        }
    }

    async validateUserCanUpdateOrDeleteRuleTemplate(req: Request) {
        const ruleTemplateId = req.params.ruleId;

        const [ruleTemplate, userPermissions] = await Promise.all([
            this.relationshipsTemplateService.getRuleById(ruleTemplateId),
            this.authorizer.getWorkspacePermissions(req.user!.id),
        ]);

        const entityTemplate = await this.entityTemplateService.getEntityTemplateById(ruleTemplate.entityTemplateId);
        if (
            !userPermissions.admin?.scope &&
            userPermissions.instances?.categories[entityTemplate.category._id]?.scope !== PermissionScope.write &&
            userPermissions.instances?.categories[entityTemplate.category._id]?.entityTemplates[entityTemplate._id]?.scope !== PermissionScope.write
        )
            throw new ForbiddenError('user not authorized', {
                metadata: `user does not have write permission on entity ${entityTemplate}`,
            });
    }
}

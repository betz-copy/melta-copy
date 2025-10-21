import { ForbiddenError, NotFoundError, PermissionScope, ValidationError } from '@microservices/shared';
import { Request } from 'express';
import EntityTemplateService from '../../externalServices/templates/entityTemplateService';
import RelationshipsTemplateService from '../../externalServices/templates/relationshipsTemplateService';
import { Authorizer } from '../../utils/authorizer';
import DefaultController from '../../utils/express/controller';

class TemplatesValidator extends DefaultController {
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

    async getRelatedCategoriesFromRelationshipTemplate(sourceEntityId: string, destinationEntityId: string) {
        const [{ category: srcCategory }, { category: dstCategory }] = await Promise.all([
            this.entityTemplateService.getEntityTemplateById(sourceEntityId),
            this.entityTemplateService.getEntityTemplateById(destinationEntityId),
        ]);

        return [srcCategory._id, dstCategory._id];
    }

    async validateUserCanCreateRelationshipTemplateUnderCategory(req: Request) {
        const { sourceEntityId, destinationEntityId } = req.body;

        const [relatedCategories, userPermissions] = await Promise.all([
            this.getRelatedCategoriesFromRelationshipTemplate(sourceEntityId, destinationEntityId),
            this.authorizer.getWorkspacePermissions(req.user!.id),
        ]);
        const categoriesOfEntitiesWithWritePermission = relatedCategories.filter(
            (categoryId) =>
                userPermissions.admin ||
                userPermissions.instances?.categories[categoryId].scope === PermissionScope.write ||
                userPermissions.instances?.categories[categoryId].entityTemplates[sourceEntityId]?.scope === PermissionScope.write ||
                userPermissions.instances?.categories[categoryId].entityTemplates[destinationEntityId]?.scope === PermissionScope.write,
        );

        if (categoriesOfEntitiesWithWritePermission.length < 2)
            throw new ForbiddenError(
                `user not authorized, does not have ${PermissionScope.write} permission on one of the categories ${relatedCategories}`,
            );
    }

    async validateUserCanUpdateOrDeleteRelationshipTemplate(req: Request) {
        const relationshipTemplate = await this.relationshipsTemplateService.getRelationshipTemplateById(req.params.id);

        const [relatedCategories, userPermissions] = await Promise.all([
            this.getRelatedCategoriesFromRelationshipTemplate(relationshipTemplate.sourceEntityId, relationshipTemplate.destinationEntityId),
            this.authorizer.getWorkspacePermissions(req.user!.id),
        ]);

        const categoriesOfEntitiesWithWritePermission = relatedCategories.filter(
            (categoryId) =>
                userPermissions.admin ||
                userPermissions.instances?.categories[categoryId].scope === PermissionScope.write ||
                userPermissions.instances?.categories[categoryId].entityTemplates[relationshipTemplate.sourceEntityId]?.scope ===
                    PermissionScope.write ||
                userPermissions.instances?.categories[categoryId].entityTemplates[relationshipTemplate.destinationEntityId]?.scope ===
                    PermissionScope.write,
        );

        if (categoriesOfEntitiesWithWritePermission.length < 2)
            throw new ForbiddenError(
                `user not authorized, does not have ${PermissionScope.write} permission on one of the categories ${relatedCategories}`,
            );
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

    async validateUserCanCreateRuleTemplate(req: Request) {
        const { entityTemplateId } = req.body;

        const [entityTemplate, userPermissions] = await Promise.all([
            this.entityTemplateService.getEntityTemplateById(entityTemplateId),
            this.authorizer.getWorkspacePermissions(req.user!.id),
        ]);

        if (
            !userPermissions.admin?.scope &&
            userPermissions.instances?.categories[entityTemplate.category._id]?.scope !== PermissionScope.write &&
            userPermissions.instances?.categories[entityTemplate.category._id]?.entityTemplates[entityTemplate._id]?.scope !== PermissionScope.write
        )
            throw new ForbiddenError('user not authorized', {
                metadata: `user does not have write permission on entity ${entityTemplate}`,
            });
    }

    // Printing Templates
    async validateUserCanCreatePrintingTemplate(req: Request) {
        return this.validateUserCanCreateRuleTemplate(req);
    }

    async validateUserCanUpdateOrDeletePrintingTemplate(req: Request) {
        return this.validateUserCanUpdateOrDeleteRuleTemplate(req);
    }

    // Child Templates
    async validateUserCanUpdateOrDeleteChildTemplate(req: Request): Promise<void> {
        const childTemplateId = req.params.id;
        const childTemplates = await this.entityTemplateService.getAllChildTemplates();
        const childTemplate = childTemplates.find((template) => template._id === childTemplateId);

        if (!childTemplate) throw new NotFoundError('Child Template not found');

        if (typeof childTemplate.category !== 'string' && typeof childTemplate.category !== 'object')
            throw new NotFoundError('Child Template category is invalid');

        const userPermissions = await this.authorizer.getWorkspacePermissions(req.user!.id);

        if (
            !userPermissions.admin?.scope &&
            userPermissions.instances?.categories[childTemplate.category._id]?.scope !== PermissionScope.write &&
            userPermissions.instances?.categories[childTemplate.category._id]?.entityTemplates[childTemplate._id]?.scope !== PermissionScope.write
        )
            throw new ForbiddenError('user not authorized', {
                metadata: `user does not have write permission on child template ${childTemplate}`,
            });
    }

    async validateCanEnableChildTemplate(req: Request): Promise<void> {
        const { disabled } = req.body;
        const childTemplateId = req.params.id;
        const childTemplates = await this.entityTemplateService.getAllChildTemplates();
        const childTemplate = childTemplates.find((template) => template._id === childTemplateId);
        if (!disabled && childTemplate?.parentTemplate.disabled)
            throw new ValidationError('Cannot enable child template under a disabled parent template');
    }
}

export default TemplatesValidator;

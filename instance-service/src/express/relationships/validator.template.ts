import { addPropertyToRequest, ValidationError } from '@microservices/shared';
import axios from 'axios';
import { Request } from 'express';
import { StatusCodes } from 'http-status-codes';
import RelationshipsTemplateManagerService from '../../externalServices/templates/relationshipTemplateManager';
import DefaultController from '../../utils/express/controller';
import { trycatch } from '../../utils/lib';
import EntityManager from '../entities/manager';

export default class RelationshipValidator extends DefaultController<EntityManager> {
    private relationshipsTemplateManagerService: RelationshipsTemplateManagerService;

    constructor(workspaceId: string) {
        super(new EntityManager(workspaceId));
        this.relationshipsTemplateManagerService = new RelationshipsTemplateManagerService(workspaceId);
    }

    private async getRelationshipTemplateByIdOrThrowValidationError(templateId: string) {
        const { result: relationshipTemplate, err: getRelationshipTemplateByIdErr } = await trycatch(() =>
            this.relationshipsTemplateManagerService.getRelationshipTemplateById(templateId),
        );

        if (getRelationshipTemplateByIdErr || !relationshipTemplate) {
            if (axios.isAxiosError(getRelationshipTemplateByIdErr) && getRelationshipTemplateByIdErr.response?.status === StatusCodes.NOT_FOUND)
                throw new ValidationError(`Relationship template doesnt exist (id: "${templateId}")`);

            throw getRelationshipTemplateByIdErr;
        }

        return relationshipTemplate;
    }

    public async validateRelationship(req: Request) {
        const { templateId, sourceEntityId, destinationEntityId } = req.body.relationshipInstance;

        const [relationshipTemplate, sourceEntity, destinationEntity] = await Promise.all([
            this.getRelationshipTemplateByIdOrThrowValidationError(templateId),
            this.manager.getEntityById(sourceEntityId),
            this.manager.getEntityById(destinationEntityId),
        ]);

        if (
            relationshipTemplate.destinationEntityId !== destinationEntity.templateId ||
            relationshipTemplate.sourceEntityId !== sourceEntity.templateId
        ) {
            throw new ValidationError(`Relationship template source/destination id does not match entity source/destination id.`);
        }

        addPropertyToRequest(req, 'relationshipTemplate', relationshipTemplate);
    }
}

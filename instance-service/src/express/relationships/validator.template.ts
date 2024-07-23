import axios from 'axios';
import { Request } from 'express';
import { RelationshipsTemplateManagerService } from '../../externalServices/templates/relationshipTemplateManager';
import { addPropertyToRequest } from '../../utils/express';
import DefaultController from '../../utils/express/controller';
import { trycatch } from '../../utils/lib';
import EntityManager from '../entities/manager';
import { ValidationError } from '../error';

export default class RelationshipValidator extends DefaultController<EntityManager> {
    private relationshipsTemplateManagerService: RelationshipsTemplateManagerService;

    constructor(dbName: string) {
        super(new EntityManager(dbName));
        this.relationshipsTemplateManagerService = new RelationshipsTemplateManagerService(dbName);
    }

    private async getRelationshipTemplateByIdOrThrowValidationError(templateId: string) {
        const { result: relationshipTemplate, err: getRelationshipTemplateByIdErr } = await trycatch(() =>
            this.relationshipsTemplateManagerService.getRelationshipTemplateById(templateId),
        );

        if (getRelationshipTemplateByIdErr || !relationshipTemplate) {
            if (axios.isAxiosError(getRelationshipTemplateByIdErr) && getRelationshipTemplateByIdErr.response?.status === 404) {
                throw new ValidationError(`Relationship template doesnt exist (id: "${templateId}")`);
            }

            throw getRelationshipTemplateByIdErr;
        }

        return relationshipTemplate;
    }

    public async validateRelationship(req: Request) {
        const { templateId, sourceEntityId, destinationEntityId } = req.body.relationshipInstance;

        const relationshipTemplate = await this.getRelationshipTemplateByIdOrThrowValidationError(templateId);

        const sourceEntity = await this.manager.getEntityById(sourceEntityId);
        const destinationEntity = await this.manager.getEntityById(destinationEntityId);

        if (
            relationshipTemplate.destinationEntityId !== destinationEntity.templateId ||
            relationshipTemplate.sourceEntityId !== sourceEntity.templateId
        ) {
            throw new ValidationError(`Relationship template source/destination id does not match entity source/destination id.`);
        }

        addPropertyToRequest(req, 'relationshipTemplate', relationshipTemplate);
    }
}

import axios from 'axios';
import { Request } from 'express';
import { RelationshipsTemplateManagerService } from '../../externalServices/templates/relationshipTemplateManager';
import { addPropertyToRequest } from '../../utils/express';
import { trycatch } from '../../utils/lib';
import EntityManager from '../entities/manager';
import { ValidationError } from '../error';
import { StatusCodes } from 'http-status-codes';

const getRelationshipTemplateByIdOrThrowValidationError = async (templateId: string) => {
    const { result: relationshipTemplate, err: getRelationshipTemplateByIdErr } = await trycatch(() =>
        RelationshipsTemplateManagerService.getRelationshipTemplateById(templateId),
    );

    if (getRelationshipTemplateByIdErr || !relationshipTemplate) {
        if (axios.isAxiosError(getRelationshipTemplateByIdErr) && getRelationshipTemplateByIdErr.response?.status === StatusCodes.NOT_FOUND) {
            throw new ValidationError(`Relationship template doesnt exist (id: "${templateId}")`);
        }

        throw getRelationshipTemplateByIdErr;
    }

    return relationshipTemplate;
};

export const validateRelationship = async (req: Request) => {
    const { templateId, sourceEntityId, destinationEntityId } = req.body.relationshipInstance;

    const relationshipTemplate = await getRelationshipTemplateByIdOrThrowValidationError(templateId);

    const sourceEntity = await EntityManager.getEntityById(sourceEntityId);
    const destinationEntity = await EntityManager.getEntityById(destinationEntityId);

    if (
        relationshipTemplate.destinationEntityId !== destinationEntity.templateId ||
        relationshipTemplate.sourceEntityId !== sourceEntity.templateId
    ) {
        throw new ValidationError(`Relationship template source/destination id does not match entity source/destination id.`);
    }

    addPropertyToRequest(req, 'relationshipTemplate', relationshipTemplate);
};

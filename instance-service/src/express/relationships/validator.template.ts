import { Request } from 'express';
import { addPropertyToRequest } from '../../utils/express';
import EntityManager from '../entities/manager';
import { ValidationError } from '../error';
import { getRelationshipTemplateById } from './template';

export const validateRelationship = async (req: Request) => {
    const { templateId, sourceEntityId, destinationEntityId } = req.body.relationshipInstance;

    const relationshipTemplate = await getRelationshipTemplateById(templateId);
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

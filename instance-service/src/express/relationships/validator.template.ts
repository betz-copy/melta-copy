import { Request } from 'express';
import EntityManager from '../entities/manager';
import { ValidationError } from '../error';
import { getRelationshipTemplateById } from './template';

const addTemplateToRequest = (req: any, templateName: string, value: any) => {
    req.body[templateName] = value;
};

export const validateRelationship = async (req: Request) => {
    const { templateId, sourceEntityId, destinationEntityId } = req.body;

    const relationshipTemplate = await getRelationshipTemplateById(templateId);
    const sourceEntity = await EntityManager.getEntityById(sourceEntityId);
    const destinationEntity = await EntityManager.getEntityById(destinationEntityId);

    if (
        relationshipTemplate.destinationEntityId !== destinationEntity.templateId ||
        relationshipTemplate.sourceEntityId !== sourceEntity.templateId
    ) {
        throw new ValidationError(`Relationship template source/destination id does not match entity source/destination id.`);
    }

    addTemplateToRequest(req, 'relationshipInstance', req.body);
    addTemplateToRequest(req, 'relationshipTemplate', relationshipTemplate);
    addTemplateToRequest(req, 'sourceEntity', sourceEntity);
    addTemplateToRequest(req, 'destinationEntity', destinationEntity);
};

import axios from 'axios';
import { Request } from 'express';
import config from '../../config';
import { trycatch } from '../../utils/lib';
import EntityManager from '../entities/manager';
import { ValidationError } from '../error';
import { IRelationshipTemplate } from './interface';

const { relationshipManager } = config;
const { url, getRelationshipByIdRoute, timeout } = relationshipManager;

export const getRelationshipTemplateById = async (templateId: string) => {
    const { result, err } = await trycatch(() => axios.get<IRelationshipTemplate>(`${url}${getRelationshipByIdRoute}/${templateId}`, { timeout }));

    if (err || !result) {
        throw new ValidationError(`Failed to fetch relationship template schema (id: ${templateId})`);
    }

    return result.data;
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
};

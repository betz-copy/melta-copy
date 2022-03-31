/* eslint-disable no-underscore-dangle */
import axios from 'axios';
import config from './config';
import { IMongoEntityTemplate } from './entityTemplates';

const { uri, createrelationshipTemplateRoute } = config.relationshipTemplateManager;

export interface IRelationshipTemplate {
    name: string;
    displayName: string;
    sourceEntityId: { name: string };
    destinationEntityId: { name: string };
}

export interface IMongoRealtionshipTemplate extends Omit<IRelationshipTemplate, 'sourceEntityId' | 'destinationEntityId'> {
    sourceEntityId: string;
    destinationEntityId: string;
    _id: string;
}

export const createRealtionshipTemplates = async (relationshipTemplates: IRelationshipTemplate[], entityTemplates: IMongoEntityTemplate[]) => {
    const promises = relationshipTemplates.map((relationshipTemplate) => {
        return axios.post<IMongoRealtionshipTemplate>(uri + createrelationshipTemplateRoute, {
            ...relationshipTemplate,
            sourceEntityId: entityTemplates.find((entityTemplate) => relationshipTemplate.sourceEntityId.name === entityTemplate.name)?._id,
            destinationEntityId: entityTemplates.find((entityTemplate) => relationshipTemplate.destinationEntityId.name === entityTemplate.name)?._id,
        });
    });

    const results = await Promise.all(promises);

    return results.map((result) => result.data);
};

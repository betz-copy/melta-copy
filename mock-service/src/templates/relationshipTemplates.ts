import config from '../config';
import { Axios } from '../utils/axios';
import { IMongoEntityTemplate } from './entityTemplates';

const {
    url,
    relationships: { createRelationshipTemplateRoute },
} = config.templateService;

export interface IRelationshipTemplate {
    name: string;
    displayName: string;
    sourceEntityId: { name: string };
    destinationEntityId: { name: string };
}

export interface IMongoRelationshipTemplate extends Omit<IRelationshipTemplate, 'sourceEntityId' | 'destinationEntityId'> {
    sourceEntityId: string;
    destinationEntityId: string;
    _id: string;
}

export const createRelationshipTemplates = async (relationshipTemplates: IRelationshipTemplate[], entityTemplates: IMongoEntityTemplate[]) => {
    const promises = relationshipTemplates.map((relationshipTemplate) => {
        return Axios.post<IMongoRelationshipTemplate>(url + createRelationshipTemplateRoute, {
            ...relationshipTemplate,
            sourceEntityId: entityTemplates.find((entityTemplate) => relationshipTemplate.sourceEntityId.name === entityTemplate.name)?._id,
            destinationEntityId: entityTemplates.find((entityTemplate) => relationshipTemplate.destinationEntityId.name === entityTemplate.name)?._id,
        });
    });

    const results = await Promise.all(promises);

    return results.map((result) => result.data);
};

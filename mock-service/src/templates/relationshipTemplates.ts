import { IMongoEntityTemplate, IMongoRelationshipTemplate, IRelationshipTemplate } from '@microservices/shared';
import config from '../config';
import createAxiosInstance from '../utils/axios';

const {
    url,
    relationships: { createRelationshipTemplateRoute },
} = config.templateService;

export interface IMockRelationshipTemplate extends Omit<IRelationshipTemplate, 'sourceEntityId' | 'destinationEntityId'> {
    sourceEntityId: { name: string };
    destinationEntityId: { name: string };
}

export const createRelationshipTemplates = async (
    workspaceId: string,
    relationshipTemplates: IMockRelationshipTemplate[],
    entityTemplates: IMongoEntityTemplate[],
) => {
    const axiosInstance = createAxiosInstance(workspaceId);

    const promises = relationshipTemplates.map((relationshipTemplate) => {
        return axiosInstance.post<IMongoRelationshipTemplate>(url + createRelationshipTemplateRoute, {
            ...relationshipTemplate,
            sourceEntityId: entityTemplates.find((entityTemplate) => relationshipTemplate.sourceEntityId.name === entityTemplate.name)?._id,
            destinationEntityId: entityTemplates.find((entityTemplate) => relationshipTemplate.destinationEntityId.name === entityTemplate.name)?._id,
        });
    });

    const results = await Promise.all(promises);

    return results.map((result) => result.data);
};

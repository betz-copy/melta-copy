import { IMongoEntityTemplate, IMongoEntityTemplateWithConstraintsPopulated } from '@packages/entity-template';
import { IMongoRelationshipTemplate, IRelationshipTemplate } from '@packages/relationship-template';
import config from '../config';
import createAxiosInstance from '../utils/axios';

const {
    url,
    relationships: { createRelationshipTemplateRoute, getRelationshipTemplateRoute },
} = config.templateService;

export interface IMockRelationshipTemplate extends Omit<IRelationshipTemplate, 'sourceEntityId' | 'destinationEntityId'> {
    sourceEntityId: { name: string };
    destinationEntityId: { name: string };
}

export const createRelationshipTemplates = async (
    workspaceId: string,
    relationshipTemplates: IMockRelationshipTemplate[],
    entityTemplates: (IMongoEntityTemplate | IMongoEntityTemplateWithConstraintsPopulated)[],
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

export const getRelationshipTemplateById = async (workspaceId: string, relationshipTemplateId: string) => {
    const axiosInstance = createAxiosInstance(workspaceId);

    const { data } = await axiosInstance.get<IMongoRelationshipTemplate>(`${url}${getRelationshipTemplateRoute}/${relationshipTemplateId}`);

    return data;
};

import axios from 'axios';
import config from './config';
import { IMongoEntityTemplate } from './entityTemplates';
import { trycatch } from './utils';
import { createAxiosInstance } from './utils/axios';

const { url, createRelationshipTemplateRoute, isAliveRoute } = config.relationshipTemplateService;

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

export const createRelationshipTemplates = async (
    workspaceId: string,
    relationshipTemplates: IRelationshipTemplate[],
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

export const isRelationshipTemplateServiceAlive = async () => {
    const { result, err } = await trycatch(() => axios.get(url + isAliveRoute));

    return { result, err };
};

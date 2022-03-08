import axios from 'axios';
import config from './config';

const {
    relationshipTemplateManager: { uri, getByIdRoute, getManyRoute },
} = config;

export interface IRelationshipTemplate {
    _id: string;
    name: string;
    displayName: string;
    sourceEntityId: string;
    destinationEntityId: string;
}

export const getRelationshipTemplatebyId = async (templateId: string): Promise<IRelationshipTemplate> => {
    const { data: relationshipTemplate } = await axios.get(`${uri}${getByIdRoute}${templateId}`);
    return relationshipTemplate;
};

export const getRelationshipTemplates = async (query: {
    name?: string;
    displayName?: string;
    sourceEntityId?: string;
    destinationEntityId?: string;
}): Promise<IRelationshipTemplate[]> => {
    const { data: relationshipTemplate } = await axios.get(`${uri}${getManyRoute}`, { params: query });
    return relationshipTemplate;
};

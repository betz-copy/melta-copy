import axios from 'axios';
import config from './config';

const {
    relationshipTemplateManager: { uri, baseRoute, searchRoute },
} = config;

export interface IRelationshipTemplate {
    _id: string;
    name: string;
    displayName: string;
    sourceEntityId: string;
    destinationEntityId: string;
}

export interface ISearchRelationshipTemplatesBody {
    search?: string;
    sourceEntityIds?: string[];
    destinationEntityIds?: string[];
    limit?: number;
    skip?: number;
}

export const getRelationshipTemplatebyId = async (templateId: string): Promise<IRelationshipTemplate> => {
    const { data: relationshipTemplate } = await axios.get(`${uri}${baseRoute}${templateId}`);
    return relationshipTemplate;
};

export const searchRelationshipTemplates = async (searchBody: ISearchRelationshipTemplatesBody = {}) => {
    const { data } = await axios.post<IRelationshipTemplate[]>(`${uri}${baseRoute}${searchRoute}`, searchBody);

    return data;
};

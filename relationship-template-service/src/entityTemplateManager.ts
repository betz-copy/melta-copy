import axios from 'axios';
import config from './config';

const {
    entityTemplateManager: { uri, getByIdRoute },
} = config;

export interface IEntityTemplate {
    _id: string;
    name: string;
    displayName: string;
    category: string;
    properties: object;
    disabled: boolean;
}

export const getEntityTemplatebyId = async (templateId: string): Promise<IEntityTemplate> => {
    const { data: entityTemplate } = await axios.get(`${uri}${getByIdRoute}${templateId}`);
    return entityTemplate;
};

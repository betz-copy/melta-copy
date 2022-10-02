import axios from 'axios';
import config from '../config';

const {
    entityTemplateManager: { url, getByIdRoute, timeout },
} = config;
export interface IEntitySingleProperty {
    type: 'string' | 'number' | 'boolean';
    title: string;
    format?: string;
    enum?: string[];
    pattern?: string;
    patternCustomErrorMessage?: string;
}

export interface IEntityTemplate {
    name: string;
    displayName: string;
    iconFileId?: string;
    properties: {
        type: 'object';
        properties: Record<string, IEntitySingleProperty>;
        required: string[];
    };
    disabled: boolean;
    category: string;
    propertiesOrder: string[];
    propertiesPreview: string[];
}

export interface IMongoEntityTemplate extends IEntityTemplate {
    _id: string;
    createdAt: string;
    updatedAt: string;
}

export class EntityTemplateManagerService {
    static EntityTemplateManagerApi = axios.create({ baseURL: url, timeout });

    // entity templates
    static async getEntityTemplateById(id: string) {
        const { data } = await this.EntityTemplateManagerApi.get<IMongoEntityTemplate>(`${getByIdRoute}/${id}`);

        return data;
    }
}

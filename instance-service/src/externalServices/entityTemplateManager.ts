import axios from 'axios';
import config from '../config';

const {
    entityTemplateService: { url, getByIdRoute, searchRoute, timeout },
} = config;
export interface IEntitySingleProperty {
    title: string;
    type: 'string' | 'number' | 'boolean' | 'array';
    format?: string;
    enum?: string[];
    items?: {
        type: 'string';
        enum?: string[];
        format?: 'fileId';
    };
    minItems?: 1;
    uniqueItems?: true;
    pattern?: string;
    patternCustomErrorMessage?: string;
    dateNotification?: string;
    serialStarter?: number;
    serialCurrent?: number;
}

export interface IEntityTemplate {
    name: string;
    displayName: string;
    iconFileId?: string;
    properties: {
        type: 'object';
        properties: Record<string, IEntitySingleProperty>;
        hide: [];
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

export interface ISearchEntityTemplatesBody {
    search?: string;
    ids?: string[];
    categoryIds?: string[];
    limit?: number;
    skip?: number;
}

export class EntityTemplateManagerService {
    static EntityTemplateManagerApi = axios.create({ baseURL: url, timeout });

    // entity templates
    static async getEntityTemplateById(id: string) {
        const { data } = await this.EntityTemplateManagerApi.get<IMongoEntityTemplate>(`${getByIdRoute}/${id}`);

        return data;
    }

    static async searchEntityTemplates(body: ISearchEntityTemplatesBody = {}) {
        const { data } = await this.EntityTemplateManagerApi.post<IMongoEntityTemplate[]>(searchRoute, body);

        return data;
    }
}

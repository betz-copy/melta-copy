import axios from 'axios';
import config from '../../config';

const {
    entityTemplateManager: { uri, baseEntitiesRoute, requestTimeout },
} = config;

export interface ICategory {
    _id: string;
    name: string;
    displayName: string;
    iconFileId: string | null;
    color: string;
}

interface IEntitySingleProperty {
    title: string;
    type: 'string' | 'number' | 'boolean';
    format?: 'date' | 'date-time' | 'email' | 'fileId';
    enum?: string[];
    pattern?: string;
    patternCustomErrorMessage?: string;
}

export interface IEntityTemplate {
    _id: string;
    name: string;
    displayName: string;
    category: string;
    properties: {
        type: 'object';
        properties: Record<string, IEntitySingleProperty>;
        required: string[];
    };
    propertiesOrder: string[];
    propertiesPreview: string[];
    disabled: boolean;
    iconFileId: string | null;
}

export interface IEntityTemplatePopulated extends Omit<IEntityTemplate, 'category'> {
    category: ICategory;
}

export interface ISearchEntityTemplatesBody {
    search?: string;
    ids?: string[];
    categoryIds?: string[];
    limit?: number;
    skip?: number;
}

export class EntityTemplateManagerService {
    private static EntityTemplateManagerApi = axios.create({ baseURL: uri, timeout: requestTimeout });

    static async searchEntityTemplates(body: ISearchEntityTemplatesBody = {}) {
        const { data } = await this.EntityTemplateManagerApi.post<IEntityTemplatePopulated[]>(`${baseEntitiesRoute}/search`, body);

        return data;
    }

    static async getEntityTemplateById(id: string) {
        const { data } = await this.EntityTemplateManagerApi.get<IEntityTemplatePopulated>(`${baseEntitiesRoute}/${id}`);

        return data;
    }

    static async createEntityTemplate(entityTemplate: Omit<IEntityTemplate, '_id'>) {
        const { data } = await this.EntityTemplateManagerApi.post(baseEntitiesRoute, entityTemplate);

        return data;
    }

    static async updateEntityTemplate(entityTemplateId: string, updatedEntityTemplate: Partial<Omit<IEntityTemplate, '_id'>>) {
        const { data } = await this.EntityTemplateManagerApi.put(`${baseEntitiesRoute}/${entityTemplateId}`, updatedEntityTemplate);

        return data;
    }

    static async deleteEntityTemplate(entityTemplateId: string) {
        const { data } = await this.EntityTemplateManagerApi.delete(`${baseEntitiesRoute}/${entityTemplateId}`);

        return data;
    }
}

import axios from 'axios';
import config from '../config';

const {
    entityTemplateManager: { uri, baseEntitiesRoute, baseCategoriesRoute, requestTimeout },
} = config;

export interface ICategory {
    name: string;
    displayName: string;
    iconFileId: string | null;
    color: string;
}

export interface IMongoCategory extends ICategory {
    _id: string;
    createdAt: string;
    updatedAt: string;
}

interface IEntitySingleProperty {
    title: string;
    type: 'string' | 'number' | 'boolean';
    format?: 'date' | 'date-time' | 'email' | 'fileId';
    enum?: string[];
    pattern?: string;
    patternCustomErrorMessage?: string;
    dateNotification?: string;
}

export interface IEntityTemplate {
    name: string;
    displayName: string;
    category: string;
    properties: {
        type: 'object';
        properties: Record<string, IEntitySingleProperty>;
        hide: string[];
    };
    propertiesOrder: string[];
    propertiesPreview: string[];
    disabled: boolean;
    iconFileId: string | null;
}

export interface IEntityTemplatePopulated extends Omit<IEntityTemplate, 'category'> {
    category: IMongoCategory;
}

export interface IMongoEntityTemplate extends IEntityTemplate {
    _id: string;
    createdAt: string;
    updatedAt: string;
}

export interface IMongoEntityTemplatePopulated extends IEntityTemplatePopulated {
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
    private static EntityTemplateManagerApi = axios.create({ baseURL: uri, timeout: requestTimeout });

    // categories
    static async getAllCategories() {
        const { data } = await this.EntityTemplateManagerApi.get<IMongoCategory[]>(baseCategoriesRoute);

        return data;
    }

    static async createCategory(category: ICategory) {
        const { data } = await this.EntityTemplateManagerApi.post<IMongoCategory>(baseCategoriesRoute, category);

        return data;
    }

    static async updateCategory(categoryId: string, updatedCategory: Partial<ICategory>) {
        const { data } = await this.EntityTemplateManagerApi.put<IMongoCategory>(`${baseCategoriesRoute}/${categoryId}`, updatedCategory);

        return data;
    }

    static async deleteCategory(categoryId: string) {
        const { data } = await this.EntityTemplateManagerApi.delete<IMongoCategory>(`${baseCategoriesRoute}/${categoryId}`);

        return data;
    }

    static async getCategoryById(categoryId: string) {
        const { data } = await this.EntityTemplateManagerApi.get<IMongoCategory>(`${baseCategoriesRoute}/${categoryId}`);

        return data;
    }

    // entity templates
    static async searchEntityTemplates(body: ISearchEntityTemplatesBody = {}) {
        const { data } = await this.EntityTemplateManagerApi.post<IMongoEntityTemplatePopulated[]>(`${baseEntitiesRoute}/search`, body);

        return data;
    }

    static async getEntityTemplateById(id: string) {
        const { data } = await this.EntityTemplateManagerApi.get<IMongoEntityTemplatePopulated>(`${baseEntitiesRoute}/${id}`);

        return data;
    }

    static async createEntityTemplate(entityTemplate: IEntityTemplate) {
        const { data } = await this.EntityTemplateManagerApi.post<IMongoEntityTemplatePopulated>(baseEntitiesRoute, entityTemplate);

        return data;
    }

    static async updateEntityTemplate(entityTemplateId: string, updatedEntityTemplate: Partial<Omit<IEntityTemplate, 'disabled'>>) {
        const { data } = await this.EntityTemplateManagerApi.put<IMongoEntityTemplatePopulated>(
            `${baseEntitiesRoute}/${entityTemplateId}`,
            updatedEntityTemplate,
        );

        return data;
    }

    static async updateEntityTemplateStatus(entityTemplateId: string, disabledStatus: boolean) {
        const { data } = await this.EntityTemplateManagerApi.patch<IMongoEntityTemplatePopulated>(`${baseEntitiesRoute}/${entityTemplateId}/status`, {
            disabled: disabledStatus,
        });

        return data;
    }

    static async deleteEntityTemplate(entityTemplateId: string) {
        const { data } = await this.EntityTemplateManagerApi.delete<IMongoEntityTemplate>(`${baseEntitiesRoute}/${entityTemplateId}`);

        return data;
    }
}

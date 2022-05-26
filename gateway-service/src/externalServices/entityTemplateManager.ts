import axios from 'axios';
import config from '../config';

const {
    entityTemplateManager: { uri, baseEntitiesRoute, baseCategoriesRoute, requestTimeout },
} = config;

export interface ICategory {
    _id: string;
    name: string;
    displayName: string;
    iconFileId: string | null;
    color: string;
}

interface IEntitySingleProperty {
    type: 'string' | 'number' | 'boolean';
    title: string;
    format?: string;
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

    // categories
    static async getAllCategories() {
        const { data } = await this.EntityTemplateManagerApi.get<ICategory[]>(baseCategoriesRoute);

        return data;
    }

    static async createCategory(category: Omit<ICategory, '_id'>) {
        const { data } = await this.EntityTemplateManagerApi.post<ICategory>(baseCategoriesRoute, category);

        return data;
    }

    static async updateCategory(categoryId: string, updatedCategory: Partial<Omit<ICategory, '_id'>>) {
        const { data } = await this.EntityTemplateManagerApi.put<ICategory>(`${baseCategoriesRoute}/${categoryId}`, updatedCategory);

        return data;
    }

    static async deleteCategory(categoryId: string) {
        const { data } = await this.EntityTemplateManagerApi.delete<ICategory>(`${baseCategoriesRoute}/${categoryId}`);

        return data;
    }

    static async getCategoryById(categoryId: string) {
        const { data } = await this.EntityTemplateManagerApi.get<ICategory>(`${baseCategoriesRoute}/${categoryId}`);

        return data;
    }

    // entity templates
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

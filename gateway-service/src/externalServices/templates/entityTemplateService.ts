import { TemplatesManagerService } from '.';
import config from '../../config';

const {
    templateService: {
        entities: { baseEntitiesRoute, baseCategoriesRoute },
    },
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

export interface IEntitySingleProperty {
    title: string;
    type: 'string' | 'number' | 'boolean' | 'array';
    format?: 'date' | 'date-time' | 'email' | 'fileId' | 'text-area' | 'relationshipReference';
    enum?: string[];
    readOnly?: true;
    items?: {
        type: 'string';
        enum?: string[];
        format?: 'fileId';
    };
    minItems?: 1;
    uniqueItems?: true;
    pattern?: string;
    patternCustomErrorMessage?: string;
    dateNotification?: number;
    isDailyAlert?: boolean;
    calculateTime?: boolean;
    serialStarter?: number;
    serialCurrent?: number;
    isNewPropertyWithNameOfDeletedProperty?: boolean;
    relationshipReference?: {
        relationshipTemplateId?: string;
        relationshipTemplateDirection: 'outgoing' | 'incoming';
        relatedTemplateId: string;
        relatedTemplateField: string;
    };
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
    propertiesTypeOrder: ('properties' | 'attachmentProperties')[];
    propertiesPreview: string[];
    enumPropertiesColors?: Record<string, Record<string, string>>; // { [fieldName]: { [enumOption1]: [color1], [enumOption2]: [color2] } }
    disabled: boolean;
    iconFileId: string | null;
    documentTemplatesIds?: string[];
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

export class EntityTemplateService extends TemplatesManagerService {
    // categories
    async getAllCategories() {
        const { data } = await this.api.get<IMongoCategory[]>(baseCategoriesRoute);

        return data;
    }

    async createCategory(category: ICategory) {
        const { data } = await this.api.post<IMongoCategory>(baseCategoriesRoute, category);

        return data;
    }

    async updateCategory(categoryId: string, updatedCategory: Partial<ICategory>) {
        const { data } = await this.api.put<IMongoCategory>(`${baseCategoriesRoute}/${categoryId}`, updatedCategory);

        return data;
    }

    async deleteCategory(categoryId: string) {
        const { data } = await this.api.delete<IMongoCategory>(`${baseCategoriesRoute}/${categoryId}`);

        return data;
    }

    async getCategoryById(categoryId: string) {
        const { data } = await this.api.get<IMongoCategory>(`${baseCategoriesRoute}/${categoryId}`);

        return data;
    }

    // entity templates
    async searchEntityTemplates(body: ISearchEntityTemplatesBody = {}) {
        const { data } = await this.api.post<IMongoEntityTemplatePopulated[]>(`${baseEntitiesRoute}/search`, body);

        return data;
    }

    async getEntityTemplateById(id: string) {
        const { data } = await this.api.get<IMongoEntityTemplatePopulated>(`${baseEntitiesRoute}/${id}`);

        return data;
    }

    async createEntityTemplate(entityTemplate: IEntityTemplate) {
        const { data } = await this.api.post<IMongoEntityTemplatePopulated>(baseEntitiesRoute, entityTemplate);

        return data;
    }

    async updateEntityTemplate(entityTemplateId: string, updatedEntityTemplate: Omit<IEntityTemplate, 'disabled'>) {
        const { data } = await this.api.put<IMongoEntityTemplatePopulated>(`${baseEntitiesRoute}/${entityTemplateId}`, updatedEntityTemplate);

        return data;
    }

    async updateEntityTemplateStatus(entityTemplateId: string, disabledStatus: boolean) {
        const { data } = await this.api.patch<IMongoEntityTemplatePopulated>(`${baseEntitiesRoute}/${entityTemplateId}/status`, {
            disabled: disabledStatus,
        });

        return data;
    }

    async deleteEntityTemplate(entityTemplateId: string) {
        const { data } = await this.api.delete<IMongoEntityTemplate>(`${baseEntitiesRoute}/${entityTemplateId}`);

        return data;
    }
}

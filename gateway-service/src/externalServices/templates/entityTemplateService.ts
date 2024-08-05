import config from '../../config';
import { TemplatesManagerService } from '.';

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
    actions?: string;
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

export class EntityTemplateManagerService extends TemplatesManagerService {
    // categories
    static async getAllCategories() {
        const { data } = await TemplatesManagerService.TemplateManagerAxiosApi.get<IMongoCategory[]>(baseCategoriesRoute);

        return data;
    }

    static async createCategory(category: ICategory) {
        const { data } = await TemplatesManagerService.TemplateManagerAxiosApi.post<IMongoCategory>(baseCategoriesRoute, category);

        return data;
    }

    static async updateCategory(categoryId: string, updatedCategory: Partial<ICategory>) {
        const { data } = await TemplatesManagerService.TemplateManagerAxiosApi.put<IMongoCategory>(
            `${baseCategoriesRoute}/${categoryId}`,
            updatedCategory,
        );

        return data;
    }

    static async deleteCategory(categoryId: string) {
        const { data } = await TemplatesManagerService.TemplateManagerAxiosApi.delete<IMongoCategory>(`${baseCategoriesRoute}/${categoryId}`);

        return data;
    }

    static async getCategoryById(categoryId: string) {
        const { data } = await TemplatesManagerService.TemplateManagerAxiosApi.get<IMongoCategory>(`${baseCategoriesRoute}/${categoryId}`);

        return data;
    }

    // entity templates
    static async searchEntityTemplates(body: ISearchEntityTemplatesBody = {}) {
        const { data } = await TemplatesManagerService.TemplateManagerAxiosApi.post<IMongoEntityTemplatePopulated[]>(
            `${baseEntitiesRoute}/search`,
            body,
        );

        return data;
    }

    static async getEntityTemplateById(id: string) {
        const { data } = await TemplatesManagerService.TemplateManagerAxiosApi.get<IMongoEntityTemplatePopulated>(`${baseEntitiesRoute}/${id}`);

        return data;
    }

    static async createEntityTemplate(entityTemplate: IEntityTemplate) {
        const { data } = await TemplatesManagerService.TemplateManagerAxiosApi.post<IMongoEntityTemplatePopulated>(baseEntitiesRoute, entityTemplate);

        return data;
    }

    static async updateEntityTemplate(entityTemplateId: string, updatedEntityTemplate: Omit<IEntityTemplate, 'disabled'>) {
        const { data } = await TemplatesManagerService.TemplateManagerAxiosApi.put<IMongoEntityTemplatePopulated>(
            `${baseEntitiesRoute}/${entityTemplateId}`,
            updatedEntityTemplate,
        );

        return data;
    }

    static async updateEntityTemplateStatus(entityTemplateId: string, disabledStatus: boolean) {
        const { data } = await TemplatesManagerService.TemplateManagerAxiosApi.patch<IMongoEntityTemplatePopulated>(
            `${baseEntitiesRoute}/${entityTemplateId}/status`,
            {
                disabled: disabledStatus,
            },
        );

        return data;
    }

    static async updateEntityTemplateAction(entityTemplateId: string, actions: string) {
        const { data } = await TemplatesManagerService.TemplateManagerAxiosApi.patch<IMongoEntityTemplatePopulated>(
            `${baseEntitiesRoute}/${entityTemplateId}/actions`,
            {
                actions,
            },
        );

        return data;
    }

    static async deleteEntityTemplate(entityTemplateId: string) {
        const { data } = await TemplatesManagerService.TemplateManagerAxiosApi.delete<IMongoEntityTemplate>(
            `${baseEntitiesRoute}/${entityTemplateId}`,
        );

        return data;
    }
}

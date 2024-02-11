import config from '../../config';
import DefaultExternalServiceApi from '../../utils/express/externalService';

const {
    entityTemplateService: { url, baseEntitiesRoute, requestTimeout },
} = config;

export interface ICategory {
    _id: string;
    name: string;
    displayName: string;
    iconFileId: string | null;
    color: string;
}

export interface IEntitySingleProperty {
    title: string;
    type: 'string' | 'number' | 'boolean' | 'array';
    format?: 'date' | 'date-time' | 'email' | 'fileId';
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
    dateNotification?: 'day' | 'week' | 'twoWeeks';
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
    propertiesTypeOrder: ('properties' | 'attachmentProperties')[];
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

export class EntityTemplateManagerService extends DefaultExternalServiceApi {
    constructor(dbName: string) {
        super(dbName, { baseURL: url, timeout: requestTimeout });
    }

    async searchEntityTemplates(body: ISearchEntityTemplatesBody = {}) {
        const { data } = await this.api.post<IEntityTemplatePopulated[]>(`${baseEntitiesRoute}/search`, body);

        return data;
    }

    async getEntityTemplateById(id: string) {
        const { data } = await this.api.get<IEntityTemplatePopulated>(`${baseEntitiesRoute}/${id}`);

        return data;
    }

    async createEntityTemplate(entityTemplate: Omit<IEntityTemplate, '_id'>) {
        const { data } = await this.api.post(baseEntitiesRoute, entityTemplate);

        return data;
    }

    async updateEntityTemplate(entityTemplateId: string, updatedEntityTemplate: Partial<Omit<IEntityTemplate, '_id'>>) {
        const { data } = await this.api.put(`${baseEntitiesRoute}/${entityTemplateId}`, updatedEntityTemplate);

        return data;
    }

    async deleteEntityTemplate(entityTemplateId: string) {
        const { data } = await this.api.delete(`${baseEntitiesRoute}/${entityTemplateId}`);

        return data;
    }
}

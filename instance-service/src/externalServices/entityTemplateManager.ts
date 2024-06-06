import config from '../config';
import DefaultExternalServiceApi from '../utils/express/externalService';

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
    calculateTime?: boolean;
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
    propertiesTypeOrder: ('properties' | 'attachmentProperties')[];
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

export class EntityTemplateManagerService extends DefaultExternalServiceApi {
    constructor(dbName: string) {
        super(dbName, { baseURL: url, timeout });
    }

    // entity templates
    async getEntityTemplateById(id: string) {
        const { data } = await this.api.get<IMongoEntityTemplate>(`${getByIdRoute}/${id}`);

        return data;
    }

    async searchEntityTemplates(body: ISearchEntityTemplatesBody = {}) {
        const { data } = await this.api.post<IMongoEntityTemplate[]>(searchRoute, body);

        return data;
    }
}

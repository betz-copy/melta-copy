import config from '../config';
import { TemplatesManagerService } from './template';

const {
    templateService: {
        entities: { baseEntitiesRoute },
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
    format?: 'date' | 'date-time' | 'email' | 'fileId' | 'text-area' | 'relationshipReference' | 'signature';
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
    isDatePastAlert?: boolean;
    alertDatePast?: boolean;
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
    documentTemplatesIds?: string[];
}

export interface IEntityTemplatePopulated extends Omit<IEntityTemplate, 'category'> {
    category: IMongoCategory;
}

export interface IMongoEntityTemplatePopulated extends IEntityTemplatePopulated {
    _id: string;
    createdAt: string;
    updatedAt: string;
}

export interface ISearchBody {
    search?: string;
    limit?: number;
    skip?: number;
}

export interface ISearchEntityTemplatesBody extends ISearchBody {
    ids?: string[];
    categoryIds?: string[];
}

export class EntityTemplateService extends TemplatesManagerService {
    async searchEntityTemplates(body: ISearchEntityTemplatesBody = {}) {
        const { data } = await this.api.post<IMongoEntityTemplatePopulated[]>(`${baseEntitiesRoute}/search`, body);

        return data;
    }
}

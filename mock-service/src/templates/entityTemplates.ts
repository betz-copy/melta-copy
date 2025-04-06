import config from '../config';
import { createAxiosInstance } from '../utils/axios';
import { IMongoCategory } from './categories';

const {
    url,
    entities: { createEntityTemplateRoute },
} = config.templateService;

export interface IEntitySingleProperty {
    title: string;
    type: 'string' | 'number' | 'boolean' | 'array';
    format?: 'date' | 'date-time' | 'email' | 'fileId' | 'text-area' | 'relationshipReference' | 'location' | 'user' | 'signature';
    enum?: string[];
    readOnly?: true;
    identifier?: true;
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

export interface IProperties {
    type: 'object';
    properties: Record<string, IEntitySingleProperty>;
    hide: string[];
}

export interface IEntityTemplate {
    name: string;
    displayName: string;
    category: string;
    properties: IProperties;
    propertiesOrder: string[];
    propertiesTypeOrder: ('properties' | 'attachmentProperties')[];
    propertiesPreview: string[];
    disabled: boolean;
    iconFileId: string | null;
    documentTemplatesIds?: string[];
}

export interface IEntityTemplateMock extends Omit<IEntityTemplate, 'category' | 'iconFileId'> {
    category: { name: string };
}

export interface IMongoEntityTemplate extends IEntityTemplate {
    _id: string;
}

export const createEntityTemplates = async (workspaceId: string, entityTemplatesToCreate: IEntityTemplateMock[], categories: IMongoCategory[]) => {
    const axiosInstance = createAxiosInstance(workspaceId);
    const results: IMongoEntityTemplate[] = [];

    for (const entityTemplate of entityTemplatesToCreate) {
        const categoryId = categories.find(category => category.name === entityTemplate.category.name)?._id;
        const response = await axiosInstance.post<IMongoEntityTemplate>(url + createEntityTemplateRoute, {...entityTemplate, category: categoryId})

        results.push(response.data)
    }

    return results
};

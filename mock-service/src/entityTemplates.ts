import axios from 'axios';
import { IMongoCategory } from './categories';
import config from './config';
import { trycatch } from './utils';

const { url, createEntityTemplateRoute, isAliveRoute } = config.entityTemplateService;

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
}

export interface IEntityTemplateMock extends Omit<IEntityTemplate, 'category' | 'iconFileId'> {
    category: { name: string };
}

export interface IMongoEntityTemplate extends IEntityTemplate {
    _id: string;
}

export const createEntityTemplates = async (entityTemplatesToCreate: IEntityTemplateMock[], categories: IMongoCategory[]) => {
    const promises = entityTemplatesToCreate.map((entityTemplate) => {
        return axios.post<IMongoEntityTemplate>(url + createEntityTemplateRoute, {
            ...entityTemplate,
            category: categories.find((category) => category.name === entityTemplate.category.name)?._id,
        });
    });

    const results = await Promise.all(promises);

    return results.map((result) => result.data);
};

export const isEntityTemplateServiceAlive = async () => {
    const { result, err } = await trycatch(() => axios.get(url + isAliveRoute));

    return { result, err };
};

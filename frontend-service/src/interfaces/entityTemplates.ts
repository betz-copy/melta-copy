import { IMongoCategory } from './categories';

export interface IEntitySingleProperty {
    type: 'string' | 'number' | 'boolean';
    title: string;
    format?: string;
    enum?: string[];
    pattern?: string;
    patternCustomErrorMessage?: string;
    dateNotification?: string;
}

export interface IEntityTemplate {
    name: string;
    displayName: string;
    iconFileId?: string;
    properties: {
        type: 'object';
        properties: Record<string, IEntitySingleProperty>;
        required: string[];
        hide: string[];
    };
    disabled: boolean;
    category: IMongoCategory['_id'];
    propertiesOrder: string[];
    propertiesPreview: string[];
    uniqueConstraints: string[][];
}

export interface IEntityTemplatePopulated extends Omit<IEntityTemplate, 'category'> {
    category: IMongoCategory;
}

export interface IMongoEntityTemplate extends IEntityTemplate {
    _id: string;
}

export interface IMongoEntityTemplatePopulated extends IEntityTemplatePopulated {
    _id: string;
}

export type IEntityTemplateMap = Map<string, IMongoEntityTemplatePopulated>;

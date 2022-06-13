import { IMongoCategory } from './categories';

interface IEntitySingleProperty {
    type: 'string' | 'number' | 'boolean';
    title: string;
    format?: string;
    enum?: string[];
}

export interface IEntityTemplate {
    name: string;
    displayName: string;
    iconFileId?: string;
    properties: {
        type: 'object';
        properties: Record<string, IEntitySingleProperty>;
        required: string[];
    };
    category: IMongoCategory['_id'];
    propertiesOrder: string[];
    propertiesPreview: string[];
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

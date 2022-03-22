import { IMongoCategory } from './categories';

export interface IEntityTemplate {
    name: string;
    displayName: string;
    iconFileId?: string;
    properties: {
        type: 'object';
        properties: { [n: string]: { type: 'string' | 'integer' | 'boolean'; title: string; fromat?: string } };
        required: string[];
    };
    category: IMongoCategory['_id'];
}

export interface IEntityTemplatePopulated {
    name: string;
    displayName: string;
    iconFileId?: string;
    properties: {
        type: 'object';
        properties: { [n: string]: { type: 'string' | 'integer' | 'boolean'; title: string; format?: string } };
        required: string[];
    };
    category: IMongoCategory;
}

export interface IMongoEntityTemplate extends IEntityTemplate {
    _id: string;
}

export interface IMongoEntityTemplatePopulated extends IEntityTemplatePopulated {
    _id: string;
}

import { IMongoCategory } from './categories';

export interface IEntitySingleProperty {
    type: 'string' | 'number' | 'boolean';
    title: string;
    format?: string;
    enum?: string[];
    pattern?: string;
    patternCustomErrorMessage?: string;
    dateNotification?: string;
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
        required: string[];
        hide: string[];
    };
    disabled: boolean;
    category: IMongoCategory['_id'];
    propertiesOrder: string[];
    propertiesTypeOrder: ('properties' | 'attachmentProperties')[];
    propertiesPreview: string[];
    enumPropertiesColors?: Record<string, Record<string, string>>; // { [fieldName]: { [enumOption1]: [color1], [enumOption2]: [color2] } }
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

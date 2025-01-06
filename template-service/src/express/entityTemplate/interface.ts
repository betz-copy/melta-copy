import { Document } from 'mongoose';
import { IMongoCategory } from '../category/interface';

export interface IEntitySingleProperty {
    title: string;
    type: 'string' | 'number' | 'boolean' | 'array';
    format?: 'date' | 'date-time' | 'email' | 'fileId' | 'text-area' | 'relationshipReference';
    enum?: string[];
    readOnly?: true;
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
    items?: {
        type: 'string';
        enum?: string[];
        format?: 'fileId';
    };
    minItems?: 1;
    uniqueItems?: true;
    archive?: boolean;
}

export interface IProperties {
    type: 'object';
    properties: Record<string, IEntitySingleProperty>;
    hide: string[];
}

export type IEnumPropertiesColors = Record<string, Record<string, string>>; // { [fieldName]: { [enumOption1]: [color1], [enumOption2]: [color2] } }

export interface IEntityTemplate {
    name: string;
    displayName: string;
    category: string;
    properties: IProperties;
    propertiesOrder: string[];
    propertiesTypeOrder: ('properties' | 'attachmentProperties')[];
    propertiesPreview: string[];
    enumPropertiesColors?: IEnumPropertiesColors;
    disabled: boolean;
    iconFileId: string | null;
    actions?: string;
    documentTemplatesIds?: string[];
}

export interface IMongoEntityTemplate extends IEntityTemplate, Document<string> {
    _id: string;
}

export interface IEntityTemplatePopulated extends Omit<IMongoEntityTemplate, 'category'> {
    category: IMongoCategory;
}

export interface ISearchEntityTemplatesBody {
    search?: string;
    ids?: string[];
    categoryIds?: string[];
    limit?: number;
    skip?: number;
}

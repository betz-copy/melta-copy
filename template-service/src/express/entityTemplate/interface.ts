import { Document } from 'mongoose';
import { IMongoCategory } from '../category/interface';

export interface IFilterOfField {
    $eq?: boolean | string | number | null;
    $ne?: boolean | string | number | null;
    $eqi?: string; // case insensitive $eq
    $rgx?: string; // Java Regular Expression (not javascript)
    $gt?: boolean | string | number;
    $gte?: boolean | string | number;
    $lt?: boolean | string | number;
    $lte?: boolean | string | number;
    $in?: Array<boolean | string | number | RegExp | null>;
    $not?: IFilterOfField;
}

export type IFilterOfTemplate<T extends Record<string, any> = Record<string, any>> = {
    [field in keyof T]?: IFilterOfField;
};

export type ISearchFilter<T extends Record<string, any> = Record<string, any>> = {
    $and?: IFilterOfTemplate<T> | IFilterOfTemplate<T>[];
    $or?: IFilterOfTemplate<T>[];
};

export interface IEntitySingleProperty {
    title: string;
    type: 'string' | 'number' | 'boolean' | 'array';
    format?:
        | 'date'
        | 'date-time'
        | 'email'
        | 'fileId'
        | 'text-area'
        | 'relationshipReference'
        | 'location'
        | 'user'
        | 'signature'
        | 'comment'
        | 'kartoffelUserField';
    enum?: string[];
    readOnly?: true;
    identifier?: true;
    pattern?: string;
    patternCustomErrorMessage?: string;
    dateNotification?: number;
    isDailyAlert?: boolean;
    isDatePastAlert?: boolean;
    calculateTime?: boolean;
    serialStarter?: number;
    serialCurrent?: number;
    expandedUserField?: {
        relatedUserField: string;
        kartoffelField: string;
    };
    relationshipReference?: {
        relationshipTemplateId?: string;
        relationshipTemplateDirection: 'outgoing' | 'incoming';
        relatedTemplateId: string;
        relatedTemplateField: string;
        filters?: ISearchFilter | string;
    };
    items?: {
        type: 'string';
        enum?: string[];
        format?: 'fileId' | 'user';
    };
    minItems?: 1;
    uniqueItems?: true;
    archive?: boolean;
    comment?: string;
    color?: string;
    hideFromDetailsPage?: boolean;
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
    mapSearchProperties?: string[];
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

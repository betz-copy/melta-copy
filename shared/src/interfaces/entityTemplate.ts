import { IMongoCategory } from './category';
import { IUniqueConstraintOfTemplate } from './entity';

export interface IRelationshipReference {
    relationshipTemplateId?: string;
    relationshipTemplateDirection: 'outgoing' | 'incoming';
    relatedTemplateId: string;
    relatedTemplateField: string;
    filters?: ISearchFilter | string;
}

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
    isNewPropNameEqualDeletedPropName?: boolean;
    expandedUserField?: {
        relatedUserField: string;
        kartoffelField: string;
    };
    relationshipReference?: IRelationshipReference;
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
    propertiesTypeOrder: ('properties' | 'attachmentProperties' | 'archiveProperties')[];
    propertiesPreview: string[];
    enumPropertiesColors?: IEnumPropertiesColors;
    disabled: boolean;
    iconFileId: string | null;
    actions?: string;
    documentTemplatesIds?: string[];
    mapSearchProperties?: string[];
}

export interface IMongoEntityTemplate extends IEntityTemplate {
    _id: string;
}

export interface IEntityTemplatePopulated extends Omit<IMongoEntityTemplate, 'category'> {
    category: IMongoCategory;
}

export interface IMongoEntityTemplatePopulated extends IEntityTemplatePopulated {
    _id: string;
    createdAt: Date;
    updatedAt: Date;
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

export type IEntityTemplateMap = Map<string, IMongoEntityTemplatePopulated>;

export interface IEntityTemplateWithConstraints extends IEntityTemplate {
    uniqueConstraints: IUniqueConstraintOfTemplate[];
    properties: IEntityTemplate['properties'] & { required: string[] };
}

export interface IMongoEntityTemplateWithConstraints extends IMongoEntityTemplate {
    uniqueConstraints: IUniqueConstraintOfTemplate[];
    properties: IEntityTemplate['properties'] & { required: string[] };
}

export interface IEntityTemplateWithConstraintsPopulated extends IEntityTemplatePopulated {
    uniqueConstraints: IUniqueConstraintOfTemplate[];
    properties: IEntityTemplate['properties'] & { required: string[] };
}

export interface IMongoEntityTemplateWithConstraintsPopulated extends IMongoEntityTemplatePopulated {
    uniqueConstraints: IUniqueConstraintOfTemplate[];
    properties: IEntityTemplate['properties'] & { required: string[] };
}

export interface IUpdateOrDeleteEnumFieldReqData {
    name: string;
    type: string;
    options: string[];
    optionColors?: Record<string, string>;
}

export type IEntityTemplateWithConstraintsMap = Map<string, IMongoEntityTemplateWithConstraintsPopulated>;

import { IMongoCategory } from '@packages/category';
import { ISearchFilter, IUniqueConstraintOfTemplate } from '@packages/entity';

export interface IRelationshipReference {
    relationshipTemplateId?: string;
    relationshipTemplateDirection: 'outgoing' | 'incoming';
    relatedTemplateId: string;
    relatedTemplateField: string;
    filters?: ISearchFilter | string;
}

export interface FieldGroupData {
    name: string;
    displayName: string;
    id: string;
}

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
        | 'kartoffelUserField'
        | 'unitField'
        | 'serialNumber'
        | 'enum'
        | 'pattern';
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
    filters?: any;
    defaultValue?: any;
    isFilterByCurrentUser?: boolean;
    isFilterByUserUnit?: boolean;
    isProfileImage?: boolean;
    display?: boolean;
    fieldGroup?: FieldGroupData;
    uniqueCheckbox?: boolean;
    properties?: Record<string, IEntitySingleProperty>; // For groups inside of entity
}
export interface IProperties {
    type: 'object';
    properties: Record<string, IEntitySingleProperty>;
    hide: string[];
}

export type IEnumPropertiesColors = Record<string, Record<string, string>>; // { [fieldName]: { [enumOption1]: [color1], [enumOption2]: [color2] } }

interface IFieldsGroup {
    name: string;
    displayName: string;
    fields: string[];
}
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
    fieldGroups?: IFieldsGroup[];
}

export interface IMongoEntityTemplate extends IEntityTemplate {
    _id: string;
}

export interface IFullMongoEntityTemplate extends IEntityTemplate {
    _id: string;
    createdAt: Date;
    updatedAt: Date;
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

export type IEntityTemplateMap = Map<string, IMongoEntityTemplateWithConstraintsPopulated>;

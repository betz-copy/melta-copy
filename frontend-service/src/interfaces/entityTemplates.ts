import { FieldGroupData } from '../common/wizards/entityTemplate/commonInterfaces';
import { IMongoCategory } from './categories';
import { IFieldsGroup, ISearchFilter, IUniqueConstraintOfTemplate } from './entities';

export interface IEntitySingleProperty {
    title: string;
    type: 'string' | 'number' | 'boolean' | 'array';
    format?: string;
    enum?: string[];
    items?: {
        type: 'string';
        enum?: string[];
        format?: 'fileId' | 'user';
    };
    minItems?: 1;
    readOnly?: true;
    identifier?: true;
    uniqueItems?: true;
    pattern?: string;
    patternCustomErrorMessage?: string;
    uniqueCheckbox?: boolean;
    dateNotification?: number;
    isDailyAlert?: boolean;
    isDatePastAlert?: boolean;
    calculateTime?: boolean;
    serialStarter?: number;
    serialCurrent?: number;
    properties?: Record<string, IEntitySingleProperty>; // For groups inside of entity
    isNewPropNameEqualDeletedPropName?: boolean;
    relationshipReference?: {
        relationshipTemplateId?: string;
        relationshipTemplateDirection: 'outgoing' | 'incoming';
        relatedTemplateId: string;
        relatedTemplateField: string;
        filters?: ISearchFilter | string;
    };
    expandedUserField?: {
        relatedUserField: string;
        kartoffelField: string;
    };
    archive?: boolean;
    fieldGroup?: FieldGroupData;
    hideFromDetailsPage?: boolean;
    comment?: string;
    color?: string;
    filters?: string;
    defaultValue?: any;
    default?: any; // Acts as defaultValue in rjsf. Added because defaultValue doesn't work in nested properties (group)
    isFilterByCurrentUser?: boolean;
    isFilterByUserUnit?: boolean;
    display?: boolean;
    accountBalance?: boolean;
}

export interface IProperties {
    type: 'object';
    properties: Record<string, IEntitySingleProperty>;
    hide: string[];
}

export interface IEntityTemplate {
    name: string;
    displayName: string;
    iconFileId?: string;
    properties: IProperties & { required: string[] };
    disabled: boolean;
    category: IMongoCategory['_id'];
    propertiesOrder: string[];
    propertiesTypeOrder: ('properties' | 'attachmentProperties' | 'archiveProperties')[];
    propertiesPreview: string[];
    enumPropertiesColors?: Record<string, Record<string, string>>; // { [fieldName]: { [enumOption1]: [color1], [enumOption2]: [color2] } }
    actions?: string;
    uniqueConstraints: IUniqueConstraintOfTemplate[];
    documentTemplatesIds?: string[];
    mapSearchProperties?: string[];
    fieldGroups?: IFieldsGroup[];
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

export interface ISearchEntityTemplateQuery {
    search?: string;
    ids?: string[];
    categoryIds?: string[];
    limit: number;
    skip: number;
}

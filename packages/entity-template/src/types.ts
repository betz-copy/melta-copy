import { IMongoCategory } from '@packages/category';
import { IFilter } from '@packages/child-template';
import { IPropertyValue, ISearchFilter, IUniqueConstraintOfTemplate } from '@packages/entity';

export enum PropertyType {
    string = 'string',
    number = 'number',
    boolean = 'boolean',
    array = 'array',
}

export enum PropertyFormat {
    date = 'date',
    'date-time' = 'date-time',
    email = 'email',
    fileId = 'fileId',
    'text-area' = 'text-area',
    relationshipReference = 'relationshipReference',
    location = 'location',
    user = 'user',
    signature = 'signature',
    comment = 'comment',
    kartoffelUserField = 'kartoffelUserField',
    unitField = 'unitField',
}

export enum PropertyExternalWizardType {
    users = 'users',
    serialNumber = 'serialNumber',
    enum = 'enum',
    pattern = 'pattern',
    multipleFiles = 'multipleFiles',
    enumArray = 'enumArray',
}

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
    type: PropertyType;
    format?: PropertyFormat;
    enum?: string[];
    readOnly?: boolean;
    identifier?: boolean;
    pattern?: string;
    patternCustomErrorMessage?: string;
    dateNotification?: number;
    isDailyAlert?: boolean;
    isDatePastAlert?: boolean;
    calculateTime?: boolean;
    serialStarter?: number;
    serialCurrent?: number;
    properties?: Record<string, IEntitySingleProperty>; // For nested groups inside of entity
    isNewPropNameEqualDeletedPropName?: boolean;
    expandedUserField?: {
        relatedUserField: string;
        kartoffelField: string;
    };
    relationshipReference?: IRelationshipReference;
    items?: {
        type: PropertyType.string;
        enum?: string[];
        format?: PropertyFormat.fileId | PropertyFormat.user;
    };
    minItems?: 1;
    uniqueItems?: true;
    archive?: boolean;
    comment?: string;
    color?: string;
    hideFromDetailsPage?: boolean;
    filters?: IFilter;
    defaultValue?: IPropertyValue;
    default?: IPropertyValue; // Acts as defaultValue in rjsf. Added because defaultValue doesn't work in nested properties (group)
    isFilterByCurrentUser?: boolean;
    isFilterByUserUnit?: boolean;
    isProfileImage?: boolean;
    display?: boolean;
    accountBalance?: boolean;
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
export interface IWalletTransfer {
    from: string;
    to: string;
    description: string;
    amount: string;
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
    walletTransfer?: IWalletTransfer;
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

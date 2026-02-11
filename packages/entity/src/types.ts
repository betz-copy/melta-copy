import { IEntitySingleProperty } from '@packages/entity-template';
import { IRelationship } from '@packages/relationship';
import { IMongoRelationshipTemplate } from '@packages/relationship-template';
import { IRuleMail } from '@packages/rule';
// biome-ignore lint/style/useNodejsImportProtocol: false positive
import { Readable } from 'stream';

// biome-ignore lint/suspicious/noExplicitAny: prop value is any
export type IPropertyValue = any;

export interface IUserField {
    _id: string;
    fullName: string;
    jobTitle?: string;
    hierarchy?: string;
    mail?: string;
    userType?: string;
}

export interface IEntity {
    templateId: string;
    childTemplateId?: string;
    properties: Record<string, IPropertyValue>;
    coloredFields?: Record<string, string>;
}

export type IConnection = {
    relationship: Pick<IRelationship, 'templateId' | 'properties'>;
    sourceEntity: IEntity;
    destinationEntity: IEntity;
};

export interface IEntityExpanded {
    entity: IEntity;
    connections: IConnection[];
}

export interface IBulkRuleMail extends IRuleMail {
    entity: IEntity;
}

export interface IBulkOfActions {
    instances: IEntity | IRelationship[];
    emails: IBulkRuleMail[];
}

export interface IUniqueConstraint {
    type: 'UNIQUE';
    constraintName: string;
    templateId: string;
    uniqueGroupName: string;
    properties: string[];
    values?: Record<string, IPropertyValue>;
}

export interface IRequiredConstraint {
    type: 'REQUIRED';
    property: string;
    constraintName: string;
    templateId: string;
    index?: number;
}

export type IValidationError = {
    message: string;
    path: string;
    schemaPath: string;
    params: Partial<IEntitySingleProperty> & { allowedValues?: string[] };
};

export enum NotFoundErrorTypes {
    userNotFound = 'USER_NOT_FOUND',
    relationshipRefNotFound = 'RELATIONSHIP_REF_NOT_FOUND',
}

export type IRelationshipRefNotFoundError = {
    type: NotFoundErrorTypes.relationshipRefNotFound;
    property: string;
    relatedIdentifier: string;
    relatedTemplateId: string;
};

export type IUsersNotFoundError = {
    type: NotFoundErrorTypes.userNotFound;
    property: string;
    attemptedIds: string[];
};

export type IExcelNotFoundError = IUsersNotFoundError | IRelationshipRefNotFoundError;

export type IConstraint = IRequiredConstraint | IUniqueConstraint;

export interface IUniqueConstraintOfTemplate {
    groupName: string;
    properties: string[];
}

export interface IConstraintsOfTemplate {
    templateId: string;
    requiredConstraints: string[];
    uniqueConstraints: IUniqueConstraintOfTemplate[];
}

export interface IEntityWithDirectConnections {
    entity: IEntity;
    relationships?: {
        relationship: Pick<IRelationship, 'templateId' | 'properties'>;
        otherEntity: IEntity;
    }[];
}

export interface IEntityWithDirectRelationships {
    entity: IEntity;
    relationships?: Array<{
        relationship: IRelationship;
        otherEntity: IEntity;
    }>;
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

export type IFilterOfTemplate<T extends Record<string, IPropertyValue> = Record<string, IPropertyValue>> = {
    [field in keyof T]?: IFilterOfField;
};

export type IFilterGroup = IFilterOfTemplate | ISearchFilter;

export enum FilterLogicalOperator {
    AND = '$and',
    OR = '$or',
}

type AndFilter = {
    [FilterLogicalOperator.AND]: IFilterOfTemplate | IFilterGroup[];
    [FilterLogicalOperator.OR]?: never;
};

type OrFilter = {
    [FilterLogicalOperator.OR]: IFilterGroup[];
    [FilterLogicalOperator.AND]?: never;
};

export type ISearchFilter = AndFilter | OrFilter;

export type ISearchSort<T extends Record<string, IPropertyValue> = Record<string, IPropertyValue>> = Array<{
    field: keyof T;
    sort: 'asc' | 'desc';
}>;

export interface ICountSearchResult {
    count: number;
    templateId: string;
    entitiesWithFiles: Record<string, string[]>; // { entityId: minioFileIds:[] }
    texts?: string[];
}
export interface ISearchEntitiesOfTemplateBody {
    skip: number;
    limit: number;
    textSearch?: string;
    filter?: ISearchFilter;
    showRelationships?: boolean | Array<IMongoRelationshipTemplate['_id']>;
    sort?: ISearchSort;
    entitiesWithFiles?: ICountSearchResult['entitiesWithFiles'];
    entityIdsToInclude?: string[];
    entityIdsToExclude?: string[];
    userEntityId?: string;
}

export interface ISearchEntitiesByTemplatesBody {
    searchConfigs: {
        [templateId: string]: ISearchEntitiesOfTemplateBody;
    };
}

export interface ISearchBatchBody {
    skip: number;
    limit: number;
    textSearch?: string;
    entityIdsToInclude?: string[];
    entityIdsToExclude?: string[];
    templates: {
        [templateId: string]: {
            filter?: ISearchFilter;
            showRelationships?: boolean | Array<IMongoRelationshipTemplate['_id']>;
            childTemplateId?: string;
        };
    };
    sort?: ISearchSort;
    shouldSemanticSearch?: boolean;
    userEntityId?: string;
}

export interface UploadedFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    stream: Readable;
    destination?: string;
    buffer?: Buffer;
}

type Coordinate = [number, number];
export interface Circle {
    coordinate: Coordinate; // [x, y]
    radius: number; // Positive number
}

export type Polygon = Coordinate[];
export interface ISearchEntitiesByLocationTemplatesBody {
    [templateId: string]: {
        filter?: ISearchFilter;
        locationFields?: string[];
    };
}
export interface ISearchEntitiesByLocationBody {
    textSearch?: string;
    templates: ISearchEntitiesByLocationTemplatesBody;
    circle?: Circle;
    polygon?: Polygon;
}

export interface ISearchResult {
    count: number;
    entities: IEntityWithDirectRelationships[];
}

export interface IFilterDatesRange {
    propertyName: string;
    dateNotificationValue: number;
    isDateTime: boolean;
    isDailyAlert: boolean;
    isDatePastAlert: boolean;
}

export interface ITemplateSearchBody {
    textSearch?: string;
    templateIds: string[];
    childTemplateIds?: string[];
}

export interface IExportEntitiesBody {
    fileName: string;
    textSearch?: string;
    templates: {
        [templateId: string]: {
            filter?: ISearchFilter;
            sort?: ISearchSort;
            displayColumns?: string[];
            headersOnly?: boolean;
            insertEntities?: Record<string, IPropertyValue>[];
            isChildTemplate?: boolean;
        };
    };
}

export interface IDeleteEntityBodyBase {
    selectAll: boolean;
    templateId: string;
    childTemplateId?: string;
    deleteAllRelationships?: boolean;
}

export type IMultipleSelect<T extends boolean = boolean> = {
    selectAll: T;
} & (T extends true
    ? {
          idsToExclude?: string[];
          filter?: ISearchEntitiesOfTemplateBody['filter'];
          textSearch?: string;
      }
    : {
          idsToInclude: string[];
      });

export type IDeleteEntityBody<T extends boolean = boolean> = IDeleteEntityBodyBase & IMultipleSelect<T>;

export enum ActionErrors {
    validation = 'VALIDATION',
    unique = 'UNIQUE',
    required = 'REQUIRED',
    filterValidation = 'FILTER_VALIDATION',
    notFound = 'NOT_FOUND',
}

export type IFailedEntityError = {
    type: ActionErrors;
    metadata: IValidationError | IUniqueConstraint | IRequiredConstraint | IExcelNotFoundError;
};

export type IFailedEntity = {
    properties: Record<string, IPropertyValue>;
    errors: IFailedEntityError[];
};

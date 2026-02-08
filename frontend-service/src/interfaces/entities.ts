import { Readable } from 'node:stream';
import { IAGGridDateFilter, IAGGridNumberFilter, IAGGridSetFilter, IAGGridTextFilter } from '../utils/agGrid/interfaces';
import { IMongoEntityTemplatePopulated } from './entityTemplates';
import { IFailedEntity } from './excel';
import { IMongoRelationship, IRelationship } from './relationships';
import { IMongoRelationshipTemplate } from './relationshipTemplates';
import { ICreateEntityMetadata } from './ruleBreaches/actionMetadata';
import { IBrokenRule } from './ruleBreaches/ruleBreach';
import { ISemanticSearchResult } from './semanticSearch';

// biome-ignore lint/suspicious/noExplicitAny: property type any
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
    properties: {
        _id: string;
        createdAt: string;
        updatedAt: string;
        disabled: boolean;
    } & Record<string, IPropertyValue>;
    coloredFields?: Record<string, string>;
}

export type IConnection = {
    relationship: Pick<IMongoRelationship, 'templateId' | 'properties'>;
    sourceEntity: IEntity;
    destinationEntity: IEntity;
};

export interface IEntityExpanded {
    entity: IEntity;
    connections: IConnection[];
}

export interface IUniqueConstraint {
    type: 'UNIQUE';
    constraintName: string;
    templateId: string;
    properties: string[];
    values?: Record<string, IPropertyValue>;
}

export interface IRequiredConstraint {
    type: 'REQUIRED';
    property: string;
    constraintName: string;
    templateId: string;
}

export enum NotFoundErrorTypes {
    relationshipRefNotFound = 'RELATIONSHIP_REF_NOT_FOUND',
    userNotFound = 'USER_NOT_FOUND',
}

export interface IRelationshipRefNotFoundError {
    type: NotFoundErrorTypes.relationshipRefNotFound;
    property: string;
    relatedIdentifier: string;
    relatedTemplateId: string;
}

export interface IUsersNotFoundError {
    type: NotFoundErrorTypes.userNotFound;
    property: string;
    attemptedIds: string[];
}

export type INotFoundError = IRelationshipRefNotFoundError | IUsersNotFoundError;

export type IConstraint = IRequiredConstraint | IUniqueConstraint;

export interface IFieldsGroup {
    name: string;
    displayName: string;
    fields: string[];
}
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

export interface IFilterOfField {
    $eq?: boolean | string | number | null;
    $ne?: boolean | string | number | null;
    $eqi?: string; // case insensitive $eq
    $rgx?: string; // Java Regular Expression (not javascript)
    $gt?: boolean | string | number;
    $gte?: boolean | string | number;
    $lt?: boolean | string | number;
    $lte?: boolean | string | number;
    $in?: Array<boolean | string | number | null>;
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

export type AndFilter = {
    [FilterLogicalOperator.AND]: IFilterOfTemplate | IFilterGroup[];
    [FilterLogicalOperator.OR]?: never;
};

export type OrFilter = {
    [FilterLogicalOperator.OR]: IFilterGroup[];
    [FilterLogicalOperator.AND]?: never;
};

export type ISearchFilter = AndFilter | OrFilter;

export type ISearchSort<T extends Record<string, IPropertyValue> = Record<string, IPropertyValue>> = Array<{
    field: keyof T;
    sort: 'asc' | 'desc';
}>;

export interface ISearchEntitiesOfTemplateBody {
    skip?: number;
    limit: number;
    textSearch?: string;
    filter?: ISearchFilter;
    showRelationships?: boolean | Array<IMongoRelationshipTemplate['_id']>;
    sort?: ISearchSort;
    entitiesWithFiles?: ICountSearchResult['entitiesWithFiles'];
}

export interface ISearchEntitiesByTemplatesBody {
    searchConfigs: {
        [templateId: string]: ISearchEntitiesOfTemplateBody;
    };
}

export interface ISearchBatchBody {
    skip?: number;
    limit: number;
    textSearch?: string;
    templates: {
        [templateId: string]: {
            filter?: ISearchFilter;
            showRelationships?: boolean | Array<IMongoRelationshipTemplate['_id']>;
            childTemplateId?: string;
        };
    };
    sort?: ISearchSort;
    shouldSemanticSearch?: boolean;
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
    entities: (IEntityWithDirectConnections & { minioFileIdsWithTexts?: ISemanticSearchResult[string][string] })[];
}

export interface ISearchResultByTemplates {
    [templateId: string]: ISearchResult;
}

export interface ICountSearchResult {
    templateId: string;
    count: number;
    entitiesWithFiles?: ISemanticSearchResult[string];
    texts?: string[];
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

export interface IGraphFilterBody {
    selectedTemplate: IMongoEntityTemplatePopulated;
    selectedProperty?: string;
    filterField?: IAGGridTextFilter | IAGGridNumberFilter | IAGGridDateFilter | IAGGridSetFilter;
}

export interface IGraphFilterBodyBatch {
    [key: string]: IGraphFilterBody;
}

export interface IDeleteEntityBodyBase {
    templateId: string;
    deleteAllRelationships?: boolean;
    childTemplateId?: string;
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

export type EntityData = IEntity | IFailedEntity | IConnection;

export interface IEntityWithIgnoredRules extends ICreateEntityMetadata {
    ignoredRules: IBrokenRule[];
}

export enum SplitBy {
    space = ' ',
    comma = ',',
}

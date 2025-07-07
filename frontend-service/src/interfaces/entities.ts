import { Readable } from 'stream';
import { IMongoEntityTemplatePopulated } from './entityTemplates';
import { IMongoRelationshipTemplate } from './relationshipTemplates';
import { IRelationship } from './relationships';
import { ISemanticSearchResult } from './semanticSearch';
import { IFailedEntity } from './excel';
import { IBrokenRule } from './ruleBreaches/ruleBreach';
import { ICreateEntityMetadata } from './ruleBreaches/actionMetadata';
import { IAGGridTextFilter, IAGGidNumberFilter, IAGGridDateFilter, IAGGridSetFilter } from '../utils/agGrid/interfaces';

export interface IEntity {
    templateId: string;
    properties: {
        _id: string;
        createdAt: string;
        updatedAt: string;
        disabled: boolean;
    } & Record<string, any>;
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

export interface IUniqueConstraint {
    type: 'UNIQUE';
    constraintName: string;
    templateId: string;
    properties: string[];
    values?: Record<string, any>;
}

export interface IRequiredConstraint {
    type: 'REQUIRED';
    constraintName: string;
    templateId: string;
    property: string;
}

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

export type IFilterOfTemplate<T extends Record<string, any> = Record<string, any>> = {
    [field in keyof T]?: IFilterOfField;
};

type IFilterGroup = IFilterOfTemplate | ISearchFilter;

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

export type ISearchSort<T extends Record<string, any> = Record<string, any>> = Array<{
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
    circle: Circle;
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
            insertEntities?: Record<string, any>[];
        };
    };
}

export interface IGraphFilterBody {
    selectedTemplate: IMongoEntityTemplatePopulated;
    selectedProperty?: string;
    filterField?: IAGGridTextFilter | IAGGidNumberFilter | IAGGridDateFilter | IAGGridSetFilter;
}

export interface IGraphFilterBodyBatch {
    [key: string]: IGraphFilterBody;
}

export interface IDeleteEntityBodyBase {
    templateId: string;
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

export type EntityData = IEntity | IFailedEntity;

export interface IEntityWithIgnoredRules extends ICreateEntityMetadata {
    ignoredRules: IBrokenRule[];
}

export enum SplitBy {
    space = ' ',
    comma = ',',
}

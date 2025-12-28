import { Readable } from 'stream';
import { IEntitySingleProperty, IMongoEntityTemplatePopulated, IMongoEntityTemplateWithConstraintsPopulated } from './entityTemplate';
import { IRelationship } from './relationship';
import { IMongoRelationshipTemplate } from './relationshipTemplate';
import { IBulkRuleMail } from './rule';
import { ActionErrors, IAction, IActionPopulated, IBrokenRule, IBrokenRulePopulated, IFailedEntity } from './ruleBreach';
import { ICreateEntityMetadata } from './ruleBreach/actionMetadata';
import { IAgGridDateFilter, IAgGridNumberFilter, IAgGridSetFilter, IAgGridTextFilter } from './ruleBreach/agGrid';

export interface IEntity {
    templateId: string;
    properties: Record<string, any>;
    coloredFields?: Record<string, string>;
}

export type IConnection = {
    relationship: Pick<IRelationship, 'templateId' | 'properties'>;
    sourceEntity: IEntity;
    destinationEntity: IEntity;
};

export interface IBulkOfActions {
    instances: IEntity | IRelationship[];
    emails: IBulkRuleMail[];
}

export interface IEntityExpanded {
    entity: IEntity;
    connections: IConnection[];
}

export interface IBrokenRulesError {
    metadata: {
        errorCode: 'RULE_BLOCK';
        rawBrokenRules: IBrokenRule[];
        brokenRules: IBrokenRulePopulated[];
        actions: IActionPopulated[];
        rawActions: IAction[];
    };
}

export interface IUniqueConstraint {
    type: 'UNIQUE';
    constraintName: string;
    templateId: string;
    uniqueGroupName: string;
    properties: string[];
    values?: Record<string, any>;
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

export interface EntitiesWizardValues {
    files?: File[];
    template?: IMongoEntityTemplateWithConstraintsPopulated;
}

export interface IValidationErrorData {
    type: string;
    message: string;
    metadata: {
        properties: Record<string, any>;
        errors: { type: ActionErrors.validation; metadata: IValidationError }[];
    };
}

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

export type IFilterOfTemplate<T extends Record<string, any> = Record<string, any>> = {
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

export type ISearchSort<T extends Record<string, any> = Record<string, any>> = Array<{
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
    showRelationships: boolean | Array<IMongoRelationshipTemplate['_id']>;
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
            showRelationships: boolean | Array<IMongoRelationshipTemplate['_id']>;
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
    circle: Circle;
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

export interface IEntityWithIgnoredRules extends ICreateEntityMetadata {
    ignoredRules: IBrokenRule[];
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
            insertEntities?: Record<string, any>[];
            isChildTemplate?: boolean;
        };
    };
}

export interface IGraphFilterBody {
    selectedTemplate: IMongoEntityTemplatePopulated;
    selectedProperty?: string;
    filterField?: IAgGridTextFilter | IAgGridNumberFilter | IAgGridDateFilter | IAgGridSetFilter;
}

export interface IGraphFilterBodyBatch {
    [key: string]: IGraphFilterBody;
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

export type EntityData = IEntity | IFailedEntity;

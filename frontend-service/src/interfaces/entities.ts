import { IMongoRelationshipTemplate } from './relationshipTemplates';
import { IRelationship } from './relationships';

export interface IEntity {
    templateId: string;
    properties: {
        _id: string;
        createdAt: string;
        updatedAt: string;
        disabled: boolean;
    } & Record<string, any>;
}

export interface IEntityExpanded {
    entity: IEntity;
    connections: {
        relationship: Pick<IRelationship, 'templateId' | 'properties'>;
        sourceEntity: IEntity;
        destinationEntity: IEntity;
    }[];
}

export interface IUniqueConstraint {
    type: 'UNIQUE';
    constraintName: string;
    templateId: string;
    properties: string[];
}

export interface IRequiredConstraint {
    type: 'REQUIRED';
    constraintName: string;
    templateId: string;
    property: string;
}

export type IConstraint = IRequiredConstraint | IUniqueConstraint;

export interface IConstraintsOfTemplate {
    templateId: string;
    requiredConstraints: string[];
    uniqueConstraints: { groupName: string; properties: string[] }[];
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

export type ISearchFilter<T extends Record<string, any> = Record<string, any>> = {
    $and?: IFilterOfTemplate<T> | IFilterOfTemplate<T>[];
    $or?: IFilterOfTemplate<T>[];
};

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
}

export interface ISearchResult {
    count: number;
    entities: IEntityWithDirectConnections[];
}

export interface IExportEntitiesBody {
    fileName: string;
    textSearch?: string;
    templates: {
        [templateId: string]: {
            filter?: ISearchFilter;
            sort?: ISearchSort;
        };
    };
}

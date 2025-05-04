import { ISubCompactPermissions } from '../permission';

export enum basicFilterOperationTypes {
    equals = 'equals',
    notEqual = 'notEqual',
    blank = 'blank',
    notBlank = 'notBlank',
}
export enum numberFilterOperationTypes {
    lessThan = 'lessThan',
    lessThanOrEqual = 'lessThanOrEqual',
    greaterThan = 'greaterThan',
    greaterThanOrEqual = 'greaterThanOrEqual',
    inRange = 'inRange',
}
export enum textFilterOperationTypes {
    contains = 'contains',
    notContains = 'notContains',
    startsWith = 'startsWith',
    endsWith = 'endsWith',
}

export enum filterTypes {
    text = 'text',
    number = 'number',
    date = 'date',
    set = 'set',
}

export interface IAgGridTextFilter {
    filterType: 'text';
    type: basicFilterOperationTypes | textFilterOperationTypes;
    filter?: string;
}

export interface IAgGridNumberFilter {
    filterType: 'number';
    type: basicFilterOperationTypes | numberFilterOperationTypes;
    filter?: number;
    filterTo?: number; // only inRange type
}

export interface IAgGridDateFilter {
    filterType: 'date';
    type: basicFilterOperationTypes | numberFilterOperationTypes;
    dateFrom: string | null;
    dateTo: string | null; // only inRange type
}

export interface IAgGridSetFilter {
    filterType: 'set';
    values: (string | null)[];
}

export type IAgGridFilterModel = IAgGridTextFilter | IAgGridNumberFilter | IAgGridDateFilter | IAgGridSetFilter;

export interface IAgGridSort {
    colId: string;
    sort: 'asc' | 'desc';
}

export interface IUserAgGridRequest {
    search?: string;
    permissions: ISubCompactPermissions | undefined;
    workspaceIds: string[] | undefined;
    limit: number;
    step: number;
    filterModel: Record<string, IAgGridFilterModel>;
    sortModel?: IAgGridSort[];
}
export interface IAgGridRequest {
    startRow: number;
    endRow: number;
    filterModel: Record<string, IAgGridFilterModel>;
    quickFilter?: string;
    sortModel: IAgGridSort[];
}

export type FilterQuery =
    | string
    | { $ne: string }
    | { $exists: boolean }
    | { $lt: number }
    | { $lte: number }
    | { $gt: number }
    | { $gte: number }
    | { $regex: RegExp }
    | { $not: { $regex: RegExp } }
    | { $in: (string | null)[] }
    | { $gte: number; $lte: number };

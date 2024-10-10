import { ISubCompactPermissions } from '../../express/permissions/interface/permissions';

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

export interface IAgGidNumberFilter {
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

export type IAgGridFilterModel = IAgGridTextFilter | IAgGidNumberFilter | IAgGridDateFilter | IAgGridSetFilter;

export interface IAgGridSort {
    colId: string;
    sort: 'asc' | 'desc';
}

export interface IAgGridRequest {
    search?: string;
    permissions: ISubCompactPermissions | undefined;
    workspaceIds: string[] | undefined;
    limit: number;
    step: number;
    filterModel: Record<string, IAgGridFilterModel>;
    sortModel: IAgGridSort[];
}

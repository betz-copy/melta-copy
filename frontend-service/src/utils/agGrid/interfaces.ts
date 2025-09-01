import { ByCurrentDefaultValue } from '../../interfaces/childTemplates';
import { IUser } from '../../interfaces/users';

export interface IAGGridTextFilter {
    filterType: 'text';
    type: 'equals' | 'notEqual' | 'contains' | 'notContains' | 'startsWith' | 'endsWith' | 'blank' | 'notBlank';
    filter?: string;
}

export interface IAGGidNumberFilter {
    filterType: 'number';
    type: 'equals' | 'notEqual' | 'lessThan' | 'lessThanOrEqual' | 'greaterThan' | 'greaterThanOrEqual' | 'inRange' | 'blank' | 'notBlank';
    filter?: number;
    filterTo?: number; // only inRange type
}

export interface IAGGridDateFilter {
    filterType: 'date';
    type:
        | 'equals'
        | 'notEqual'
        | 'lessThan'
        | 'lessThanOrEqual'
        | 'greaterThan'
        | 'greaterThanOrEqual'
        | 'thisWeek'
        | 'thisMonth'
        | 'thisYear'
        | 'inRange'
        | 'blank'
        | 'notBlank';
    dateFrom: string | null;
    dateTo: string | null; // only inRange type
}

export enum RelativeDateFilters {
    thisWeek = 'thisWeek',
    thisMonth = 'thisMonth',
    thisYear = 'thisYear',
}

export type IFilterDateType =
    | Date
    | ByCurrentDefaultValue.byCurrentDate
    | RelativeDateFilters.thisWeek
    | RelativeDateFilters.thisMonth
    | RelativeDateFilters.thisYear
    | null;

export interface IAGGridSetFilter {
    filterType: 'set';
    values: (string | IUser | null)[];
}

export interface IAGGridFilterModel {
    [key: string]: IAGGridTextFilter | IAGGidNumberFilter | IAGGridDateFilter | IAGGridSetFilter;
}

export interface IAGGridSort {
    colId: string;
    sort: 'asc' | 'desc';
}

export interface IAGGridRequest {
    startRow: number;
    endRow: number;
    filterModel: IAGGridFilterModel;
    quickFilter?: string;
    sortModel: IAGGridSort[];
}

import { IMongoCategory } from '../../../interfaces/categories';
import { IEntitySingleProperty } from '../../../interfaces/entityTemplates';
import { IAGGridTextFilter, IAGGidNumberFilter, IAGGridDateFilter, IAGGridSetFilter } from '../../../utils/agGrid/interfaces';

export interface IFieldFilter {
    fieldValue: IEntitySingleProperty;
    selected: boolean;
    filterField?: IAGGridTextFilter | IAGGidNumberFilter | IAGGridDateFilter | IAGGridSetFilter;
    defaultValue?: string | number | boolean | Date | string[];
}

export interface IFieldChip {
    fieldName: string;
    chipType: 'filter' | 'default';
    filterType?: IAGGridTextFilter | IAGGidNumberFilter | IAGGridDateFilter | IAGGridSetFilter;
    value: string | number | boolean | Date | string[];
}

export enum ViewType {
    categoryPage = 'categoryPage',
    userPage = 'userPage',
}

export interface IChildTemplateProperty {
    title: string;
    type: string;
    format?: string;
    filters?: Record<string, unknown>;
    defaultValue?: string | number | boolean | Date | string[];
}

export interface IEntityChildTemplate {
    name: string;
    displayName: string;
    description: string;
    fatherTemplateId: string;
    categories: IMongoCategory['_id'][];
    properties: Record<string, IChildTemplateProperty>;
    disabled: boolean;
    actions?: string;
    viewType: ViewType;
    isFilterByCurrentUser: boolean;
    isFilterByUserUnit: boolean;
}
export interface IMongoEntityChildTemplate extends IEntityChildTemplate {
    _id: string;
}

export type IEntityChildTemplateMap = Map<string, IMongoEntityChildTemplate>;

export interface ITemplateFieldsFilters {
    [key: string]: IFieldFilter;
}

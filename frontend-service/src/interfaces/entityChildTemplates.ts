import { IAGGridSetFilter, IAGGridTextFilter, IAGGidNumberFilter, IAGGridDateFilter } from '../utils/agGrid/interfaces';
import { IEntitySingleProperty } from './entityTemplates';
import { IMongoCategory } from './categories';

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

export interface ITemplateFieldsFilters {
    [key: string]: IFieldFilter;
}

export enum ViewType {
    categoryPage = 'categoryPage',
    userPage = 'userPage',
}

export interface IChildTemplateProperty {
    title: string;
    type: string;
    format?: string;
    defaultValue?: any;
    filters?: string | Record<string, unknown>;
}

export interface IEntityChildTemplate {
    name: string;
    displayName: string;
    description?: string;
    fatherTemplateId: string;
    categories: string[];
    properties: Record<string, IChildTemplateProperty>;
    disabled: boolean;
    viewType: ViewType;
    isFilterByCurrentUser: boolean;
    isFilterByUserUnit: boolean;
}

export interface IMongoChildEntityTemplate extends IEntityChildTemplate {
    _id: string;
    createdAt: string;
    updatedAt: string;
}

export type IEntityChildTemplateMap = Map<string, IMongoChildEntityTemplate>;

export interface IChildEntityTemplatePopulated extends Omit<IEntityChildTemplate, 'categories'> {
    categories: IMongoCategory[];
}

export interface IMongoChildEntityTemplatePopulated extends IChildEntityTemplatePopulated {
    _id: string;
}

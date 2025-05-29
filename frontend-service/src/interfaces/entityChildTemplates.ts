import { IAGGridSetFilter, IAGGridTextFilter, IAGGidNumberFilter, IAGGridDateFilter } from '../utils/agGrid/interfaces';
import { IEntitySingleProperty, IMongoEntityTemplatePopulated } from './entityTemplates';
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
    _id: string;
    name: string;
    displayName: string;
    description: string;
    categories: string[]; // Array of category IDs
    fatherTemplateId: string;
    properties: Record<
        string,
        {
            title: string;
            type: string;
            format?: string;
        }
    >;
    disabled: boolean;
    viewType: ViewType;
    isFilterByCurrentUser: boolean;
    isFilterByUserUnit: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export type IEntityChildTemplateMap = Map<string, IEntityChildTemplate>;

export interface ITemplateFieldsFilters {
    [key: string]: IFieldFilter;
}

export interface IChildEntityTemplatePopulated extends Omit<IEntityChildTemplate, 'categories' | 'fatherTemplateId'> {
    categories: IMongoCategory[];
    fatherTemplateId: IMongoEntityTemplatePopulated;
}

export interface IMongoChildEntityTemplate extends IEntityChildTemplate {
    _id: string;
}

export interface IMongoChildEntityTemplatePopulated extends IChildEntityTemplatePopulated {
    _id: string;
}

import { IAGGridSetFilter, IAGGridTextFilter, IAGGidNumberFilter, IAGGridDateFilter } from '../utils/agGrid/interfaces';
import { IEntitySingleProperty, IMongoEntityTemplatePopulated } from './entityTemplates';
import { IMongoCategory } from './categories';

export interface IFieldFilter {
    fieldValue: IEntitySingleProperty;
    selected: boolean;
    filterField?: IAGGridTextFilter | IAGGidNumberFilter | IAGGridDateFilter | IAGGridSetFilter;
    defaultValue?: string | number | boolean | Date | string[];
    isEditableByUser?: boolean;
}

export interface IFieldChip {
    fieldName: string;
    chipType: 'filter' | 'default';
    filterType?: IAGGridTextFilter | IAGGidNumberFilter | IAGGridDateFilter | IAGGridSetFilter;
    value?: string | number | boolean | Date | string[];
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
    isEditableByUser?: boolean;
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
    filterByCurrentUserField?: string;
    actions?: string;
}

export interface IMongoChildEntityTemplate extends IEntityChildTemplate {
    _id: string;
    createdAt: string;
    updatedAt: string;
}

export type IEntityChildTemplateMap = Map<string, IMongoChildEntityTemplate>;

export interface IChildEntityTemplatePopulated extends Omit<IEntityChildTemplate, 'categories' | 'fatherTemplateId'> {
    categories: IMongoCategory[];
    fatherTemplateId: IMongoEntityTemplatePopulated;
}

export interface IMongoChildEntityTemplatePopulated extends IChildEntityTemplatePopulated {
    _id: string;
}

export enum EntityTemplateType {
    Child = 'Child',
    Parent = 'Parent',
}

export interface EntityTemplateBase {
    type: EntityTemplateType;
}

export interface ChildTemplate extends EntityTemplateBase {
    type: EntityTemplateType.Child;
    metaData: IMongoChildEntityTemplate;
}

export interface ParentTemplate extends EntityTemplateBase {
    type: EntityTemplateType.Parent;
    metaData: IMongoEntityTemplatePopulated;
}

export type TemplateItem = ChildTemplate | ParentTemplate;
export type IEntityChildTemplateMapPopulated = Map<string, IMongoChildEntityTemplatePopulated>;

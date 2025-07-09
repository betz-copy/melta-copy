import { IAGGridSetFilter, IAGGridTextFilter, IAGGidNumberFilter, IAGGridDateFilter } from '../utils/agGrid/interfaces';
import { IEntitySingleProperty, IMongoEntityTemplate, IMongoEntityTemplatePopulated } from './entityTemplates';
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
    defaultValue?: string | number | boolean | Date | string[];
    filters?: Record<string, unknown>;
    isEditableByUser?: boolean;
}

export interface IChildTemplate {
    name: string;
    displayName: string;
    description?: string;
    parentTemplateId: string;
    category: string[];
    properties: { properties: Record<string, IChildTemplateProperty> };
    disabled: boolean;
    viewType: ViewType;
    isFilterByCurrentUser: boolean;
    isFilterByUserUnit: boolean;
    filterByCurrentUserField?: string;
    actions?: string;
}

export interface IMongoChildTemplate extends IChildTemplate {
    _id: string;
    createdAt: string;
    updatedAt: string;
}

export type IChildTemplateMap = Map<string, IChildTemplatePopulated>;

export interface IChildTemplatePopulatedFromDb extends Omit<IMongoChildTemplate, 'category' | 'parentTemplateId'> {
    parentTemplate: IMongoEntityTemplatePopulated;
    category: IMongoCategory;
}

export interface IChildTemplatePopulated
    extends Omit<IMongoEntityTemplate, 'properties' | 'category'>,
        Omit<IChildTemplatePopulatedFromDb, 'properties'> {
    properties: IMongoEntityTemplate['properties'] & {
        properties: Record<string, IEntitySingleProperty & IChildTemplateProperty>;
    };
}

export interface IMongoChildTemplatePopulated extends IChildTemplatePopulated {
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
    metaData: IMongoChildTemplatePopulated;
}

export interface ParentTemplate extends EntityTemplateBase {
    type: EntityTemplateType.Parent;
    metaData: IMongoEntityTemplatePopulated;
}

export type TemplateItem = ChildTemplate | ParentTemplate;
export type IChildTemplateMapPopulated = Map<string, IMongoChildTemplatePopulated>;

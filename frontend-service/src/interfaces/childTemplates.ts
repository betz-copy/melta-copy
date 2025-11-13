import { IAGGridFilter } from '../common/wizards/entityTemplate/commonInterfaces';
import { IAGGridDateFilter, IAGGridNumberFilter, IAGGridSetFilter, IAGGridTextFilter } from '../utils/agGrid/interfaces';
import { IMongoCategory } from './categories';
import { IEntitySingleProperty, IMongoEntityTemplate, IMongoEntityTemplatePopulated } from './entityTemplates';

export interface IFieldFilter {
    fieldValue: IEntitySingleProperty;
    selected: boolean;
    filterField?: IAGGridTextFilter | IAGGridNumberFilter | IAGGridDateFilter | IAGGridSetFilter;
    defaultValue?: string | number | boolean | Date | string[];
    isEditableByUser?: boolean;
}

export enum ChipType {
    Filter = 'filters',
    Default = 'defaultValue',
    EditByUser = 'isEditableByUser',
}

export type AllowedChipType = Exclude<ChipType, ChipType.EditByUser>;

export interface IFieldChip {
    fieldName: string;
    chipType: AllowedChipType;
    filterField?: IAGGridTextFilter | IAGGridNumberFilter | IAGGridDateFilter | IAGGridSetFilter;
    defaultValue?: string | number | boolean | Date | string[];
}

export interface ITemplateFieldsFilters {
    [key: string]: IFieldFilter;
}

export enum ViewType {
    categoryPage = 'categoryPage',
    userPage = 'userPage',
}
export enum ByCurrentDefaultValue {
    byCurrentUser = 'byCurrentUser',
    byCurrentDate = 'byCurrentDate',
}

export interface IChildTemplateProperty {
    defaultValue?: string | number | boolean | Date | string[] | ByCurrentDefaultValue;
    filters?: Record<string, unknown>;
    isEditableByUser?: boolean;
    display?: boolean;
}

export interface IChildTemplate {
    name: string;
    displayName: string;
    description?: string;
    parentTemplateId: string;
    category: string;
    properties: { properties: Record<string, IChildTemplateProperty> };
    disabled: boolean;
    viewType: ViewType;
    isFilterByCurrentUser: boolean;
    isFilterByUserUnit: boolean;
    filterByCurrentUserField?: string;
    filterByUnitUserField?: string;
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

export type IChildTemplateFormProperty = Omit<IChildTemplateProperty, 'filters'> & { filters?: IAGGridFilter[] };

export interface IChildTemplateForm extends Omit<IChildTemplatePopulatedFromDb, 'properties'> {
    properties: { properties: Record<string, IChildTemplateFormProperty> };
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

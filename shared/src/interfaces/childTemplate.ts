import { Document } from 'mongoose';
import { IMongoCategory } from './category';
import {
    IEntitySingleProperty,
    IFullMongoEntityTemplate,
    IMongoEntityTemplate,
    IMongoEntityTemplatePopulated,
    IProperties,
    ISearchBody,
} from './entityTemplate';
import { IUniqueConstraintOfTemplate } from './entity';

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
    description: string;
    parentTemplateId: string;
    category: IMongoCategory['_id'];
    properties: { properties: Record<string, IChildTemplateProperty> };
    disabled: boolean;
    actions?: string;
    viewType: ViewType;
    isFilterByCurrentUser: boolean;
    isFilterByUserUnit: boolean;
    filterByCurrentUserField?: string;
}

export interface IMongoChildTemplate extends IChildTemplate, Document<string> {
    _id: string;
}

export interface IChildTemplatePopulatedFromDb extends Omit<IMongoChildTemplate, 'category' | 'parentTemplateId'> {
    parentTemplate: IFullMongoEntityTemplate;
    category: IMongoCategory;
}

export interface ISearchChildTemplatesBody extends ISearchBody {
    ids?: string[];
    categoryIds?: string[];
    parentTemplatesIds?: string[];
}

// When populating child, it will ask the parent for all of its properties.
export interface IChildTemplatePopulated
    extends Omit<IMongoEntityTemplate, 'properties' | 'category'>,
        Omit<IChildTemplatePopulatedFromDb, 'properties'> {
    properties: Omit<IProperties, 'properties'> & {
        properties: Record<string, IEntitySingleProperty & IChildTemplateProperty>;
    };
}

export interface IChildTemplateWithParent extends Omit<IMongoEntityTemplate, 'properties' | 'category'>, Omit<IChildTemplate, 'properties'> {
    properties: Omit<IProperties, 'properties'> & {
        properties: Record<string, IEntitySingleProperty & IChildTemplateProperty>;
    };
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
    metaData: IChildTemplatePopulated;
}

export interface ParentTemplate extends EntityTemplateBase {
    type: EntityTemplateType.Parent;
    metaData: IMongoEntityTemplatePopulated;
}

export type TemplateItem = ChildTemplate | ParentTemplate;

export interface IChildTemplateWithConstraints extends IChildTemplate {
    uniqueConstraints: IUniqueConstraintOfTemplate[];
    properties: IChildTemplate['properties'] & { required: string[] };
}

export interface IMongoChildTemplateWithConstraints extends IChildTemplatePopulatedFromDb {
    uniqueConstraints: IUniqueConstraintOfTemplate[];
    properties: IChildTemplate['properties'] & { required: string[] };
}

export interface IChildTemplateWithConstraintsPopulated extends IChildTemplatePopulated {
    uniqueConstraints: IUniqueConstraintOfTemplate[];
    properties: IChildTemplatePopulated['properties'] & { required: string[] };
}

export interface IMongoChildTemplateWithConstraintsPopulated extends IChildTemplatePopulatedFromDb {
    uniqueConstraints: IUniqueConstraintOfTemplate[];
    properties: IChildTemplate['properties'] & { required: string[] };
}

export type IChildTemplateWithConstraintsMap = Map<string, IMongoChildTemplateWithConstraintsPopulated>;

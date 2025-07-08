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
    fatherTemplateId: string;
    categories: IMongoCategory['_id'][];
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

export interface IEntityChildTemplatePopulatedFromDb extends Omit<IMongoChildTemplate, 'categories' | 'fatherTemplateId'> {
    fatherTemplateId: IFullMongoEntityTemplate;
    categories: IMongoCategory[];
}

export interface ISearchEntityChildTemplatesBody extends ISearchBody {
    ids?: string[];
    categoryIds?: string[];
    fatherTemplatesIds?: string[];
}

// When populating child, it will ask the parent for all of its properties.
export interface IEntityChildTemplatePopulated
    extends Omit<IMongoEntityTemplate, 'properties' | 'category'>,
        Omit<IEntityChildTemplatePopulatedFromDb, 'properties'> {
    properties: Omit<IProperties, 'properties'> & {
        properties: Record<string, IEntitySingleProperty & IChildTemplateProperty>;
    };
}

export interface IEntityChildTemplateWithFather extends Omit<IMongoEntityTemplate, 'properties' | 'category'>, Omit<IChildTemplate, 'properties'> {
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
    metaData: IEntityChildTemplatePopulated;
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

export interface IMongoChildTemplateWithConstraints extends IEntityChildTemplatePopulatedFromDb {
    uniqueConstraints: IUniqueConstraintOfTemplate[];
    properties: IChildTemplate['properties'] & { required: string[] };
}

export interface IChildTemplateWithConstraintsPopulated extends IEntityChildTemplatePopulated {
    uniqueConstraints: IUniqueConstraintOfTemplate[];
    properties: IEntityChildTemplatePopulated['properties'] & { required: string[] };
}

export interface IMongoChildTemplateWithConstraintsPopulated extends IEntityChildTemplatePopulatedFromDb {
    uniqueConstraints: IUniqueConstraintOfTemplate[];
    properties: IChildTemplate['properties'] & { required: string[] };
}

export type IChildTemplateWithConstraintsMap = Map<string, IMongoChildTemplateWithConstraintsPopulated>;

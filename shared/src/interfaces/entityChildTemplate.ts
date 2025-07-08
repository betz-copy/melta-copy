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

export enum ViewType {
    categoryPage = 'categoryPage',
    userPage = 'userPage',
}

export interface IEntityChildTemplateProperty {
    defaultValue?: string | number | boolean | Date | string[];
    filters?: Record<string, unknown>;
    isEditableByUser?: boolean;
}

export interface IEntityChildTemplate {
    name: string;
    displayName: string;
    description: string;
    fatherTemplateId: string;
    categories: IMongoCategory['_id'][];
    properties: { properties: Record<string, IEntityChildTemplateProperty> };
    disabled: boolean;
    actions?: string;
    viewType: ViewType;
    isFilterByCurrentUser: boolean;
    isFilterByUserUnit: boolean;
    filterByCurrentUserField?: string;
}

export interface IMongoEntityChildTemplate extends IEntityChildTemplate, Document<string> {
    _id: string;
}

export interface IEntityChildTemplatePopulatedFromDb extends Omit<IMongoEntityChildTemplate, 'categories' | 'fatherTemplateId'> {
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
    extends Omit<IMongoEntityTemplate, 'properties'>,
        Omit<IEntityChildTemplatePopulatedFromDb, 'properties'> {
    properties: Omit<IProperties, 'properties'> & {
        properties: Record<string, IEntitySingleProperty & IEntityChildTemplateProperty>;
    };
}

export interface IEntityChildTemplateWithFather extends Omit<IMongoEntityTemplate, 'properties'>, Omit<IEntityChildTemplate, 'properties'> {
    properties: Omit<IProperties, 'properties'> & {
        properties: Record<string, IEntitySingleProperty & IEntityChildTemplateProperty>;
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

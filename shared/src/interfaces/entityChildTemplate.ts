import { Document } from 'mongoose';
import { IMongoCategory } from './category';
import { IEntitySingleProperty, IFullMongoEntityTemplate, IMongoEntityTemplatePopulated, ISearchBody } from './entityTemplate';

export enum ViewType {
    categoryPage = 'categoryPage',
    userPage = 'userPage',
}

export interface IEntityChildTemplateProperty {
    title: string;
    type: string;
    format?: string;
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
    properties: Record<string, IEntityChildTemplateProperty>;
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

export interface IEntityChildTemplatePopulated extends Omit<IMongoEntityChildTemplate, 'categories' | 'fatherTemplateId'> {
    fatherTemplateId: IFullMongoEntityTemplate;
    categories: IMongoCategory[];
}

export interface IMongoEntityChildTemplatePopulated extends IEntityChildTemplatePopulated {
    _id: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface ISearchEntityChildTemplatesBody extends ISearchBody {
    ids?: string[];
    categoryIds?: string[];
    fatherTemplatesIds?: string[];
}

export interface IEntityChildTemplatePropertiesPopulated extends Omit<IEntityChildTemplatePopulated, 'properties'> {
    properties: Record<string, IEntitySingleProperty>;
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

import { Document } from 'mongoose';
import { IMongoCategory } from './category';
import { IMongoEntityTemplate } from './entityTemplate';

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
    fatherTemplateId: IMongoEntityTemplate;
    categories: IMongoCategory[];
}

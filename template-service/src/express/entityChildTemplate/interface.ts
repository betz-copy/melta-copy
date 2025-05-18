import { Document } from 'mongoose';
import { IMongoCategory, IMongoEntityTemplate } from '@microservices/shared';

export enum ViewType {
    categoryPage = 'categoryPage',
    userPage = 'userPage',
}

export interface IEntityChildTemplate {
    name: string;
    displayName: string;
    description: string;
    fatherTemplateId: string;
    categories: IMongoCategory['_id'][];
    properties: Record<string, unknown>;
    disabled: boolean;
    actions?: string;
    viewType: ViewType;
    defaults: Record<string, string | number | boolean | Date | string[]>;
    filters: Record<string, unknown>;
    isFilterByCurrentUser: boolean;
    isFilterByUserUnit: boolean;
}

export interface IMongoEntityChildTemplate extends IEntityChildTemplate, Document<string> {
    _id: string;
}

export interface IEntityChildTemplatePopulated extends Omit<IMongoEntityChildTemplate, 'categories' | 'fatherTemplate'> {
    fatherTemplate: IMongoEntityTemplate;
    categories: IMongoCategory[];
}

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
    fatherTemplate: string;
    categories: string[];
    propertiesFilters: Record<string, unknown>;
    disabled: boolean;
    actions: string;
    viewType: ViewType;
    filterByCurrentUser: boolean;
    filterByUserUnit: boolean;
}

export interface IMongoEntityChildTemplate extends IEntityChildTemplate, Document<string> {
    _id: string;
}

export interface IEntityChildTemplatePopulated extends Omit<IMongoEntityChildTemplate, 'categories' | 'fatherTemplate'> {
    fatherTemplate: IMongoEntityTemplate;
    categories: IMongoCategory[];
}

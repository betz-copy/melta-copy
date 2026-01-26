import { IMongoProps } from '@packages/common';

export interface ICategory {
    name: string;
    displayName: string;
    iconFileId: string | null;
    color: string;
    templatesOrder: string[];
}

export interface IMongoCategory extends ICategory, IMongoProps {}

export interface ISearchCategoriesBody {
    search?: string;
    ids?: string[];
    limit?: number;
    skip?: number;
}

export type ICategoryMap = Map<string, IMongoCategory>;

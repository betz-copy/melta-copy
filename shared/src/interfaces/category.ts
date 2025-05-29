export interface ICategory {
    name: string;
    displayName: string;
    iconFileId: string | null;
    color: string;
    templatesOrder: string[];
}

export interface IMongoCategory extends ICategory {
    _id: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface ISearchCategoriesBody {
    search?: string;
    ids?: string[];
    limit?: number;
    skip?: number;
}

export type ICategoryMap = Map<string, IMongoCategory>;

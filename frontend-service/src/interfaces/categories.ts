export interface ICategory {
    name: string;
    displayName: string;
    iconFileId?: string;
    color: string;
    templatesOrder: string[];
}

export interface IMongoCategory extends ICategory {
    _id: string;
}

export type ICategoryMap = Map<string, IMongoCategory>;

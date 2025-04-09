export interface ICategory {
    name: string;
    displayName: string;
    iconFileId?: string;
    color: string;
    templateOrder: string[];
    fractionalIndex: string;
}

export interface IMongoCategory extends ICategory {
    _id: string;
}

export type ICategoryMap = Map<string, IMongoCategory>;

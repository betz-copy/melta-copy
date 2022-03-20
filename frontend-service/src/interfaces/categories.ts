export interface ICategory {
    name: string;
    displayName: string;
    iconFileId?: string;
}

export interface IMongoCategory extends ICategory {
    _id: string;
}

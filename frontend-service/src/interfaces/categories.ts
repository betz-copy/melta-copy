export interface ICategory {
    name: string;
    displayName: string;
}

export interface IMongoCategory extends ICategory {
    _id: string;
}

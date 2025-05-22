export enum ConfigTypes {
    BASE = 'base',
    CATEGORY_ORDER = 'categoryOrder',
}

export interface IBaseConfig {
    type: ConfigTypes;
}

export interface IMongoBaseConfig extends IBaseConfig {
    _id: string;
    createdAt: string;
    updatedAt: string;
}

export interface ICategoryOrderConfig extends IBaseConfig {
    order: string[];
}

export interface IMongoCategoryOrderConfig extends ICategoryOrderConfig {
    _id: string;
    createdAt: string;
    updatedAt: string;
}

export enum ConfigTypes {
    BASE = 'base',
    ORDER = 'order',
}

export interface IBaseConfig {
    name: string;
    type: ConfigTypes;
}

export interface IMongoBaseConfig extends IBaseConfig {
    _id: string;
}

export interface IOrderConfig extends IBaseConfig {
    order: string[];
}

export interface IMongoOrderConfig extends IOrderConfig {
    _id: string;
}

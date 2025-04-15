import { Document } from 'mongoose';

export interface IBaseConfig {
    name: string;
    type: ConfigTypes;
}

export interface IMongoBaseConfig extends IBaseConfig, Document<string> {
    _id: string;
}

export interface IOrderConfig extends IBaseConfig {
    order: string[];
}

export interface IMongoOrderConfig extends IOrderConfig, Document<string> {
    _id: string;
}

export enum ConfigTypes {
    BASE = 'base',
    ORDER = 'order',
}

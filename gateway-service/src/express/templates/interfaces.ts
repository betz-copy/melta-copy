import {
    IEntityTemplate,
    IEntityTemplatePopulated,
    IMongoEntityTemplate,
    IMongoEntityTemplatePopulated,
} from '../../externalServices/entityTemplateService';

export interface IEntityTemplateWithConstraints extends IEntityTemplate {
    uniqueConstraints: string[][];
    properties: IEntityTemplate['properties'] & { required: string[] };
}

export interface IMongoEntityTemplateWithConstraints extends IMongoEntityTemplate {
    uniqueConstraints: string[][];
    properties: IEntityTemplate['properties'] & { required: string[] };
}

export interface IEntityTemplateWithConstraintsPopulated extends IEntityTemplatePopulated {
    uniqueConstraints: string[][];
    properties: IEntityTemplate['properties'] & { required: string[] };
}

export interface IMongoEntityTemplateWithConstraintsPopulated extends IMongoEntityTemplatePopulated {
    uniqueConstraints: string[][];
    properties: IEntityTemplate['properties'] & { required: string[] };
}

export interface IUpdateOrDeleteEnumFieldReqData {
    name: string;
    type: string;
    options: string[];
    optionColors?: Record<string, string>;
}

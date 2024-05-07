import {
    IEntityTemplate,
    IEntityTemplatePopulated,
    IMongoEntityTemplate,
    IMongoEntityTemplatePopulated,
} from '../../externalServices/entityTemplateService';

export interface IEntityTemplateWithConstraints extends IEntityTemplate {
    uniqueConstraints: { groupName: string; properties: string[] }[];
    properties: IEntityTemplate['properties'] & { required: string[] };
}

export interface IMongoEntityTemplateWithConstraints extends IMongoEntityTemplate {
    uniqueConstraints: { groupName: string; properties: string[] }[];
    properties: IEntityTemplate['properties'] & { required: string[] };
}

export interface IEntityTemplateWithConstraintsPopulated extends IEntityTemplatePopulated {
    uniqueConstraints: { groupName: string; properties: string[] }[];
    properties: IEntityTemplate['properties'] & { required: string[] };
}

export interface IMongoEntityTemplateWithConstraintsPopulated extends IMongoEntityTemplatePopulated {
    uniqueConstraints: { groupName: string; properties: string[] }[];
    properties: IEntityTemplate['properties'] & { required: string[] };
}

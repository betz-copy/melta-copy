import {
    IEntityTemplate,
    IEntityTemplatePopulated,
    IMongoEntityTemplate,
    IMongoEntityTemplatePopulated,
} from '../../externalServices/entityTemplateService';
import { IUniqueConstraintOfTemplate } from '../../externalServices/instanceService/interfaces/entities';

export interface IEntityTemplateWithConstraints extends IEntityTemplate {
    uniqueConstraints: IUniqueConstraintOfTemplate[];
    properties: IEntityTemplate['properties'] & { required: string[] };
}

export interface IMongoEntityTemplateWithConstraints extends IMongoEntityTemplate {
    uniqueConstraints: IUniqueConstraintOfTemplate[];
    properties: IEntityTemplate['properties'] & { required: string[] };
}

export interface IEntityTemplateWithConstraintsPopulated extends IEntityTemplatePopulated {
    uniqueConstraints: IUniqueConstraintOfTemplate[];
    properties: IEntityTemplate['properties'] & { required: string[] };
}

export interface IMongoEntityTemplateWithConstraintsPopulated extends IMongoEntityTemplatePopulated {
    uniqueConstraints: IUniqueConstraintOfTemplate[];
    properties: IEntityTemplate['properties'] & { required: string[] };
}

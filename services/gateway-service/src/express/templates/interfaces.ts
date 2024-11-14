import {
    IEntityTemplate,
    IEntityTemplatePopulated,
    IMongoEntityTemplate,
    IMongoEntityTemplatePopulated,
} from '@microservices/shared/src/interfaces/entityTemplate';
import { IUniqueConstraintOfTemplate } from '@microservices/shared/src/interfaces/entity';

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

export interface IUpdateOrDeleteEnumFieldReqData {
    name: string;
    type: string;
    options: string[];
    optionColors?: Record<string, string>;
}

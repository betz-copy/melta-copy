import {
    IEntityTemplate,
    IEntityTemplatePopulated,
    IMongoEntityTemplate,
    IMongoEntityTemplatePopulated,
} from '../../externalServices/entityTemplateManager';

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

export interface CommonFormInputProperties {
    name: string;
    title: string;
    type: string;
    id: string;
    options: string[];
    optionColors?: Record<string, string | undefined>;
    pattern: string;
    patternCustomErrorMessage: string;
    dateNotification?: string | null;
    serialStarter?: number;
    required?: boolean;
    preview?: boolean;
    hide?: boolean;
    unique?: boolean;
}

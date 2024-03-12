import { IMongoStepTemplate, IMongoStepTemplatePopulated } from './stepTemplate';

export enum PropertyFormats {
    Date = 'date',
    DateTime = 'date-time',
    Email = 'email',
    FileId = 'fileId',
    EntityReference = 'entityReference',
}

export interface IProcessSingleProperty {
    title: string;
    type: 'string' | 'number' | 'boolean' | 'array';
    format?: PropertyFormats;
    items?: {
        type: 'string';
        enum?: string[];
        format?: 'fileId';
    };
    enum?: string[];
    pattern?: string;
    patternCustomErrorMessage?: string;
}
export interface IProcessDetails {
    properties: {
        type: 'object';
        properties: Record<string, IProcessSingleProperty>;
        required: string[];
    };
    propertiesOrder: string[];
}

export interface IProcessTemplate {
    name: string;
    displayName: string;
    details: IProcessDetails;
    steps: string[];
}
export interface IProcessTemplateWithSteps extends Omit<IProcessTemplate, 'steps'> {
    steps: IMongoStepTemplate[];
}

export interface IMongoProcessTemplate extends IProcessTemplate {
    _id: string;
    createdAt: string;
    updatedAt: string;
}

export interface IMongoProcessTemplateWithSteps extends IProcessTemplateWithSteps {
    _id: string;
    createdAt: string;
    updatedAt: string;
}

export interface IMongoProcessTemplatePopulated extends Omit<IProcessTemplateWithSteps, 'steps'> {
    steps: IMongoStepTemplatePopulated[];
}

export interface IBaseSearchProperties {
    ids?: string[];
    reviewerId?: string;
    limit: number;
    skip: number;
}
export interface ISearchProcessTemplatesBody extends Partial<IBaseSearchProperties> {
    displayName?: string;
}

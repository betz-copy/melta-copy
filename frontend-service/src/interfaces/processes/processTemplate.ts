import { IMongoStepTemplate, IMongoStepTemplatePopulated, IStepTemplate } from './stepTemplate';

export interface IProcessSingleProperty {
    title: string;
    type: 'string' | 'number' | 'boolean';
    format?: 'date' | 'date-time' | 'email' | 'fileId' | 'entityReference';
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
export interface ICreateProcessTemplateBody extends Omit<IProcessTemplate, 'steps'> {
    steps: IStepTemplate[];
}

export interface IUpdateProcessTemplateBody extends Omit<IProcessTemplate, 'steps'> {
    steps: (IStepTemplate & { _id: string })[];
}

export interface IMongoProcessTemplate extends IProcessTemplate {
    _id: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface IMongoProcessTemplateWithSteps extends IProcessTemplateWithSteps {
    _id: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface IMongoProcessTemplatePopulated extends Omit<IMongoProcessTemplateWithSteps, 'steps'> {
    steps: IMongoStepTemplatePopulated[];
}

export interface IBaseSearchProperties {
    ids?: string[];
    limit?: number;
    skip?: number;
}
export interface ISearchProcessTemplatesBody extends IBaseSearchProperties {
    displayName?: string;
}

export type IProcessTemplateMap = Map<string, IMongoProcessTemplatePopulated>;

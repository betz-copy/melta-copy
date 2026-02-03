import { PropertyType } from '../entityTemplates';
import { IMongoStepTemplate, IMongoStepTemplatePopulated, IStepTemplate } from './stepTemplate';

export interface IProcessSingleProperty {
    title: string;
    type: PropertyType;
    format?: 'date' | 'date-time' | 'email' | 'fileId' | 'entityReference' | 'text-area' | 'signature';
    enum?: string[];
    items?: {
        type: PropertyType.string;
        enum?: string[];
        format?: 'fileId';
    };
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
    reviewerId?: string;
    limit?: number;
    skip?: number;
}
export interface ISearchProcessTemplatesBody extends IBaseSearchProperties {
    displayName?: string;
}

export type IProcessTemplateMap = Map<string, IMongoProcessTemplatePopulated>;

export const defaultProcessTemplate: IMongoProcessTemplatePopulated = {
    _id: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    details: {
        properties: {
            properties: {},
            required: [],
            type: 'object',
        },
        propertiesOrder: [],
    },
    displayName: '',
    name: '',
    steps: [],
};

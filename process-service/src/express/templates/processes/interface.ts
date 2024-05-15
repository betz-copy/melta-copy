import { Document } from 'mongoose';
import { IMongoStepTemplate } from '../steps/interface';

export enum ProcessPropertyFormats {
    Date = 'date',
    DateTime = 'date-time',
    Email = 'email',
    FileId = 'fileId',
    EntityReference = 'entityReference',
    TextArea = 'text-area',
}

export interface IProcessSingleProperty {
    title: string;
    type: 'string' | 'number' | 'boolean' | 'array';
    format?: ProcessPropertyFormats;
    enum?: string[];
    items?: {
        type: 'string';
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
export interface IProcessTemplatePopulated extends Omit<IProcessTemplate, 'steps'> {
    steps: IMongoStepTemplate[];
}

export interface IMongoProcessTemplate extends IProcessTemplate {
    _id: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface IMongoProcessTemplatePopulated extends IProcessTemplatePopulated {
    _id: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface IBaseSearchProperties {
    ids?: string[];
    reviewerId?: string;
    limit: number;
    skip: number;
}
export interface IProcessTemplateSearchProperties extends IBaseSearchProperties {
    displayName?: string;
}
export type ProcessTemplateDocument = IProcessTemplate & Document;

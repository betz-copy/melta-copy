import { Document } from 'mongoose';
import { IMongoStepTemplate } from '../steps/interface';

export interface IProcessSingleProperty {
    title: string;
    type: 'string' | 'number' | 'boolean';
    format?: 'date' | 'date-time' | 'email' | 'fileId' | 'entityId';
    enum?: string[];
    pattern?: string;
    patternCustomErrorMessage?: string;
}
export interface IProcessDetails {
    properties: {
        type: 'object';
        properties: Record<string, IProcessSingleProperty>;
    };
    propertiesOrder: string[];
}

export interface IProcessTemplate {
    name: string;
    displayName: string;
    details: IProcessDetails;
    steps: string[];
    summaryDetails: IProcessDetails;
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

export type ProcessTemplateDocument = IProcessTemplate & Document;

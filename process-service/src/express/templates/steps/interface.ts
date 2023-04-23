import { Document } from 'mongoose';
import { IProcessDetails } from '../processes/interface';

export interface IStepTemplate extends IProcessDetails {
    name: string;
    displayName: string;
    reviewers: string[];
    iconFileId: string | null;
}

export interface IMongoStepTemplate extends IStepTemplate {
    _id: string;
    createdAt: Date;
    updatedAt: Date;
}

export type StepTemplateDocument = IStepTemplate & Document;

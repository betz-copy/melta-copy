import { Document } from 'mongoose';
import { Status } from '../processes/interface';

export interface IStepInstance {
    templateId: string;
    properties?: Record<string, any>;
    status: Status;
    reviewers: string[];
    reviewerId?: string;
    reviewedAt?: Date;
}

export interface IMongoStepInstance extends IStepInstance {
    _id: string;
    createdAt: Date;
    updatedAt: Date;
}

export type StepInstanceDocument = IStepInstance & Document;

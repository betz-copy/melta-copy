import { Document } from 'mongoose';
import { InstanceProperties, Status } from '../processes/interface';

export interface IStepInstance {
    templateId: string;
    properties?: Record<string, any>;
    comments?: string;
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

export interface UpdateStepReqBody {
    processId: string;
    properties?: InstanceProperties;
    comments?: string;
    statusReview?: {
        status: Status;
        reviewerId: string;
    };
}

export type StepInstanceDocument = IStepInstance & Document;

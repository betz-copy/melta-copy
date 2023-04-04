import { Document } from 'mongoose';
import { IMongoStepInstance } from '../steps/interface';

export enum Status {
    Pending = 'pending',
    Approved = 'approved',
    Rejected = 'rejected',
}

export type InstanceDetails = Record<string, any>;
export interface IProcessInstance {
    templateId: string;
    name: string;
    details: Record<string, any>;
    steps: string[];
    status: Status;
    reviewerId?: string;
    reviewedAt?: Date;
    summaryDetails?: Record<string, any>;
}
export interface IProcessInstancePopulated extends Omit<IProcessInstance, 'steps'> {
    steps: IMongoStepInstance[];
}
export interface IMongoProcessInstance extends IProcessInstance {
    _id: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface IMongoProcessInstancePopulated extends IProcessInstancePopulated {
    _id: string;
    createdAt: Date;
    updatedAt: Date;
}

export type CreateAndUpdateProcessReqBody = Pick<IProcessInstance, 'details' | 'name' | 'summaryDetails'> &
    Partial<Pick<IProcessInstance, 'templateId'>> & {
        steps: Record<string, string[]>;
    };

export type ProcessInstanceDocument = IProcessInstance & Document;

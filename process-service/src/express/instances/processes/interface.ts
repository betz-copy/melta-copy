import { Document } from 'mongoose';
import { IMongoStepInstance } from '../steps/interface';
import { IBaseSearchProperties } from '../../templates/processes/interface';

export enum Status {
    Pending = 'pending',
    Approved = 'approved',
    Rejected = 'rejected',
}

export type InstanceProperties = Record<string, any>;
export interface IProcessInstance {
    templateId: string;
    name: string;
    details: Record<string, any>;
    startDate: Date;
    endDate: Date;
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

export type CreateProcessReqBody = Pick<IProcessInstance, 'templateId' | 'name' | 'details'> & { steps: Record<string, string[]> };
export type UpdateProcessReqBody = Partial<Omit<IProcessInstance, 'templateId' | 'reviewedAt' | 'steps'> & { steps: Record<string, string[]> }>;

export interface IProcessInstanceSearchProperties extends IBaseSearchProperties {
    name?: string;
    templateIds?: string[];
    startDate?: Date;
    endDate?: Date;
    status?: Status;
}

export type ProcessInstanceDocument = IProcessInstance & Document;

import { IEntity } from '../../entity';
import { IMongoEntityTemplateWithConstraintsPopulated } from '../../entityTemplate';
import { IUser } from '../../user';
import { IBaseSearchProperties } from '../templates/process';
import { IMongoStepInstance, IMongoStepInstancePopulated } from './step';

export enum Status {
    Pending = 'pending',
    Approved = 'approved',
    Rejected = 'rejected',
}

export enum ProcessStatus {
    Pending = 'pending',
    Approved = 'approved',
    Rejected = 'rejected',
    Archived = 'archived',
}

export type InstanceProperties = Record<string, any>;

export interface IProcessInstance {
    templateId: string;
    name: string;
    details: InstanceProperties;
    startDate: Date;
    endDate: Date;
    steps: string[];
    status: Status;
    reviewedAt: Date;
    reviewerId: string;
    archived: boolean;
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

export interface IMongoProcessInstanceReviewerPopulated extends Omit<IMongoProcessInstance, 'steps'> {
    steps: IMongoStepInstancePopulated[];
}

export type CreateProcessReqBody = Pick<IProcessInstance, 'templateId' | 'name' | 'details' | 'startDate' | 'endDate'> & {
    steps: Record<string, string[]>;
};

export type UpdateProcessReqBody = Partial<
    Omit<IProcessInstance, 'templateId' | 'steps' | 'status'> & {
        steps: Record<string, string[]>;
    }
>;

export interface IProcessInstanceSearchProperties extends IBaseSearchProperties {
    searchText?: string;
    templateIds?: string[];
    status?: Status[];
    startDate?: Date;
    endDate?: Date;
    archived?: boolean;
}

export interface ProcessInstanceDocument extends IProcessInstance {
    _id: string;
}

export interface IReferencedEntityForProcess {
    entity: IEntity;
    userHavePermission: boolean;
    entityTemplate: IMongoEntityTemplateWithConstraintsPopulated;
}

export type StepsObjectPopulated = Record<string, IUser[]>;

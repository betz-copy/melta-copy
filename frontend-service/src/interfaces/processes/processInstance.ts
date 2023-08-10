import { IUser } from '../../services/kartoffelService';
import { IEntity } from '../entities';
import { IMongoEntityTemplatePopulated } from '../entityTemplates';
import { IBaseSearchProperties } from './processTemplate';
import { IMongoStepInstance, IMongoStepInstancePopulated } from './stepInstance';

export enum Status {
    Pending = 'pending',
    Approved = 'approved',
    Rejected = 'rejected',
}

export type InstanceProperties = Record<string, any>;
export interface IProcessInstance {
    templateId: string;
    name: string;
    startDate: Date;
    endDate: Date;
    details: InstanceProperties;
    steps: string[];
    status: Status;
    reviewedAt?: Date;
}
export interface IProcessInstanceWithSteps extends Omit<IProcessInstance, 'steps'> {
    steps: IMongoStepInstance[];
}
export interface IMongoProcessInstance extends IProcessInstance {
    _id: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface IMongoProcessInstanceWithSteps extends IProcessInstanceWithSteps {
    _id: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface IMongoProcessInstancePopulated extends Omit<IMongoProcessInstance, 'steps' | 'reviewerId'> {
    steps: IMongoStepInstancePopulated[];
    reviewer?: IUser;
}

export interface ISearchProcessInstancesBody extends IBaseSearchProperties {
    name?: string;
    templateIds?: string[];
    startDate?: Date;
    endDate?: Date;
    status?: Status;
}

export type StepsObjectPopulated = Record<string, IUser[]>;

export interface IReferencedEntityForProcess {
    entity: IEntity;
    entityTemplate: IMongoEntityTemplatePopulated;
    userHavePermission: boolean;
}

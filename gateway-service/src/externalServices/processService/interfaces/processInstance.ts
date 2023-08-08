import { IUser } from '../../../express/users/interface';
import { IMongoEntityTemplatePopulated } from '../../entityTemplateManager';
import { IEntity } from '../../instanceManager';
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
    details: InstanceProperties;
    startDate: Date;
    endDate: Date;
    steps: string[];
    status: Status;
    reviewerId?: string;
    reviewedAt?: String;
    summaryDetails?: InstanceProperties;
}
export interface IProcessInstanceWithSteps extends Omit<IProcessInstance, 'steps'> {
    steps: IMongoStepInstance[];
}
export interface IMongoProcessInstance extends IProcessInstance {
    _id: string;
    createdAt: string;
    updatedAt: string;
}
export interface IMongoProcessInstanceWithSteps extends IProcessInstanceWithSteps {
    _id: string;
    createdAt: string;
    updatedAt: string;
}

export interface IMongoProcessInstancePopulated extends Omit<IMongoProcessInstance, 'steps' | 'reviewerId'> {
    steps: IMongoStepInstancePopulated[];
    reviewer?: IUser;
}

export interface ISearchProcessInstancesBody extends IBaseSearchProperties {
    name?: string;
    templateIds?: string[];
    status?: Status;
    startDate?: Date;
    endDate?: Date;
}

export interface IReferencedEntityForProcess {
    entity: IEntity;
    userHavePermission: boolean;
    entityTemplate: IMongoEntityTemplatePopulated;
}

import { IMongoEntityTemplatePopulated } from '../../templates/entityTemplateService';
import { IEntity } from '../../instanceService/interfaces/entities';
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
    reviewedAt?: Date;
    archived: boolean;
}
export interface IUpdatedProcessStatus {
    status: Status;
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

export interface IMongoProcessInstancePopulated extends Omit<IMongoProcessInstance, 'steps'> {
    steps: IMongoStepInstancePopulated[];
}

export interface ISearchProcessInstancesBody extends IBaseSearchProperties {
    searchText?: string;
    templateIds?: string[];
    status?: Status[];
    startDate?: Date;
    endDate?: Date;
    archived?: boolean;
    isWaitingForMeFilterOn?: boolean;
    isStepStatusPendeing?: boolean;
    userId?: string;
}

export interface IReferencedEntityForProcess {
    entity: IEntity;
    userHavePermission: boolean;
    entityTemplate: IMongoEntityTemplatePopulated;
}

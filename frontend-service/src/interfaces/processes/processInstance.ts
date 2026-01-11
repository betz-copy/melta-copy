import { IEntity, IPropertyValue } from '../entities';
import { IMongoEntityTemplatePopulated } from '../entityTemplates';
import { IUser } from '../users';
import { IBaseSearchProperties } from './processTemplate';
import { IMongoStepInstance, IMongoStepInstancePopulated } from './stepInstance';

export enum Status {
    Pending = 'pending',
    Approved = 'approved',
    Rejected = 'rejected',
}

export enum StatusColors {
    Pending = '#ff8f00',
    Approved = '#2e7d32',
    Rejected = '#d32f2f',
    Archived = '#B0B0B0',
    All = '#0288d1',
}
export enum StatusColorsNames {
    Pending = '#ff8f00',
    Approved = '#1ABC00',
    Rejected = '#d32f2f',
    Archived = '#B0B0B0',
}

export enum StatusFontColors {
    Pending = '#FF9900',
    Approved = '#1ABC00',
    Rejected = '#FF2E00',
    Archived = '#B0B0B0',
}

export enum StatusBackgroundColors {
    Pending = '#FF99001A',
    Approved = '#E0F0DD',
    Rejected = '#F7CDC4',
    Archived = '#B0B0B0',
}

export type InstanceProperties = Record<string, IPropertyValue>;
export interface IProcessInstance {
    templateId: string;
    name: string;
    startDate: Date;
    endDate: Date;
    details: InstanceProperties;
    steps: string[];
    status: Status;
    reviewedAt?: Date;
    archived: boolean;
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

export interface IMongoProcessInstancePopulated extends Omit<IMongoProcessInstance, 'steps'> {
    steps: IMongoStepInstancePopulated[];
}

export interface ISearchProcessInstancesBody extends IBaseSearchProperties {
    searchText?: string;
    templateIds?: string[];
    startDate?: Date;
    endDate?: Date;
    status?: Status[];
    archived?: boolean;
    isWaitingForMeFilterOn?: boolean;
    isStepStatusPendeing?: boolean;
}

export type StepsObjectPopulated = Record<string, IUser[]>;

export interface IReferencedEntityForProcess {
    entity: IEntity;
    entityTemplate: IMongoEntityTemplatePopulated;
    userHavePermission: boolean;
}

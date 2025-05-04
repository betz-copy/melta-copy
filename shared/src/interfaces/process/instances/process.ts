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
    isWaitingForMeFilterOn?: boolean;
    isStepStatusPendeing?: boolean;
    userId?: string;
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

export interface ProcessInstanceDocument extends IProcessInstance {
    _id: string;
}

export interface IReferencedEntityForProcess {
    entity: IEntity;
    userHavePermission: boolean;
    entityTemplate: IMongoEntityTemplateWithConstraintsPopulated;
}

export type StepsObjectPopulated = Record<string, IUser[]>;

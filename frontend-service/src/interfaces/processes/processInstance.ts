import { IUser } from '../../services/kartoffelService';
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
    reviewerId?: string;
    reviewedAt?: Date;
    summaryDetails?: InstanceProperties;
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

// Define the common fields for creating and updating a process instance
type CommonProcessInstanceFields = Pick<IProcessInstance, 'details' | 'name'> & { detailsAttachments: Object };

// The steps need to be key value object
// ** When Create ** --> The keys are the step TemplateIds the values are arrays .
// ** When update ** --> The keys = step InstanceIds the values are arrays of all reviewerIds (old and new)
export type StepsObject = Record<string, string[]>;

export type StepsObjectPopulated = Record<string, IUser[]>;

export type ICreateProcessInstanceBody = CommonProcessInstanceFields & {
    templateId: IProcessInstance['templateId'];
    steps: StepsObject;
};

// Define the optional fields for updating a process instance
export type IUpdateProcessInstanceBody = Partial<
    Omit<IProcessInstance, 'templateId' | 'reviewerId' | 'reviewedAt' | 'steps'> & { steps: StepsObject }
>;

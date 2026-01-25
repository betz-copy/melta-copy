import { IEntity, IPropertyValue } from '@packages/entity';
import { IMongoEntityTemplateWithConstraintsPopulated, PropertyType } from '@packages/entity-template';
import { IUser } from '@packages/user';

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

export interface IStepInstance {
    templateId: string;
    properties?: Record<string, IPropertyValue>;
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

export interface IMongoStepInstancePopulated extends Omit<IMongoStepInstance, 'reviewerId' | 'reviewers'> {
    reviewers: IUser[];
    reviewer?: IUser;
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

export type IGenericStep = Pick<IMongoStepInstance, '_id' | 'reviewers'>;
export type IGenericStepPopulated = Pick<IMongoStepInstancePopulated, '_id' | 'reviewers'>;

export enum ProcessPropertyFormats {
    Date = 'date',
    DateTime = 'date-time',
    Email = 'email',
    FileId = 'fileId',
    EntityReference = 'entityReference',
    TextArea = 'text-area',
    Signature = 'signature',
}

export interface IProcessSingleProperty {
    title: string;
    type: PropertyType;
    format?: ProcessPropertyFormats;
    enum?: string[];
    items?: {
        type: PropertyType.string;
        enum?: string[];
        format?: 'fileId';
    };
    pattern?: string;
    patternCustomErrorMessage?: string;
}
export interface IProcessDetails {
    properties: {
        type: 'object';
        properties: Record<string, IProcessSingleProperty>;
        required: string[];
    };
    propertiesOrder: string[];
}

export interface IProcessTemplate {
    name: string;
    displayName: string;
    details: IProcessDetails;
    steps: string[];
}
export interface IProcessTemplatePopulated extends Omit<IProcessTemplate, 'steps'> {
    steps: IMongoStepTemplate[];
}

export interface ICreateProcessTemplateBody extends Omit<IProcessTemplate, 'steps'> {
    steps: IStepTemplate[];
}

export interface IUpdateProcessTemplateBody extends Omit<IProcessTemplate, 'steps'> {
    steps: (IStepTemplate & { _id: string })[];
}

export interface IMongoProcessTemplate extends IProcessTemplate {
    _id: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface IMongoProcessTemplatePopulated extends IProcessTemplatePopulated {
    _id: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface IMongoProcessTemplateReviewerPopulated extends Omit<IMongoProcessTemplatePopulated, 'steps'> {
    steps: IMongoStepTemplatePopulated[];
}
export type IProcessTemplateMap = Map<string, IMongoProcessTemplateReviewerPopulated>;

export interface IBaseSearchProperties {
    ids?: string[];
    reviewerId?: string;
    limit: number;
    skip: number;
}

export interface IProcessTemplateSearchProperties extends IBaseSearchProperties {
    displayName?: string;
}

export interface ISearchProcessTemplatesBody extends Partial<IBaseSearchProperties> {
    displayName?: string;
}

export interface IStepTemplate extends IProcessDetails {
    name: string;
    displayName: string;
    reviewers: string[];
    disableAddingReviewers?: boolean;
    iconFileId: string | null;
}

export interface IMongoStepTemplate extends IStepTemplate {
    _id: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface IMongoStepTemplatePopulated extends Omit<IMongoStepTemplate, 'reviewers'> {
    reviewers: IUser[];
}

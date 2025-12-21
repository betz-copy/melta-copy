import { ActionsLog } from '@packages/activity-log';

interface IBaseActivityLog {
    _id: string;
    timestamp: Date;
    entityId: string;
    userId: string;
}

export enum Status {
    Pending = 'pending',
    Approved = 'approved',
    Rejected = 'rejected',
}

interface IEmptyMetadata extends IBaseActivityLog {
    action: ActionsLog.CREATE_ENTITY | ActionsLog.DISABLE_ENTITY | ActionsLog.ACTIVATE_ENTITY | ActionsLog.VIEW_ENTITY | ActionsLog.CREATE_PROCESS;
    metadata: object;
}

interface IRelationshipMetadata extends IBaseActivityLog {
    action: ActionsLog.DELETE_RELATIONSHIP | ActionsLog.CREATE_RELATIONSHIP;
    metadata: { relationshipId: string; relationshipTemplateId: string; entityId: string };
}

interface IDuplicateEntityMetadata extends IBaseActivityLog {
    action: ActionsLog.DUPLICATE_ENTITY;
    metadata: { entityIdDuplicatedFrom: string };
}

interface IUpdateEntityMetadata extends IBaseActivityLog {
    action: ActionsLog.UPDATE_ENTITY | ActionsLog.UPDATE_PROCESS;
    metadata: { updatedFields: [{ fieldName: string; oldValue: any; newValue: any }] };
}

export interface IUpdateProcessStepMetadata extends IBaseActivityLog {
    action: ActionsLog.UPDATE_PROCESS_STEP;
    metadata: { updatedFields?: [{ fieldName: string; oldValue: any; newValue: any }]; comments?: string; status?: Status };
}

export type IActivityLog = IEmptyMetadata | IRelationshipMetadata | IDuplicateEntityMetadata | IUpdateEntityMetadata | IUpdateProcessStepMetadata;

export type SearchParams = Partial<{
    limit: number;
    skip: number;
    actions: string[];
    searchText: string;
    fieldsSearch: string[];
    startDateRange: Date;
    endDateRange: Date;
}>;

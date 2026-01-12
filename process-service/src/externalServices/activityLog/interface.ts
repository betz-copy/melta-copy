import { ActionsLog } from '@packages/activity-log';
import { IPropertyValue } from '@packages/entity';
import { Status } from '@packages/process';

export interface IUpdatedFields {
    fieldName: string;
    oldValue: IPropertyValue;
    newValue: IPropertyValue;
}

interface IBaseActivityLog {
    timestamp: Date;
    entityId: string;
    userId: string;
    _id: string;
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
    metadata: { updatedFields: IUpdatedFields[] };
}

export interface IUpdateProcessStepMetadata extends IBaseActivityLog {
    action: ActionsLog.UPDATE_PROCESS_STEP;
    metadata: { updatedFields?: IUpdatedFields[]; comments?: string; status?: Status };
}

export type IActivityLog = IEmptyMetadata | IRelationshipMetadata | IDuplicateEntityMetadata | IUpdateEntityMetadata | IUpdateProcessStepMetadata;

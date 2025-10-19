import axios from '../axios';
import { environment } from '../globals';
import { IEntitySingleProperty } from '../interfaces/entityTemplates';
import { Status } from '../interfaces/processes/processInstance';
import { IProcessSingleProperty } from '../interfaces/processes/processTemplate';

const { activityLog } = environment.api;

interface IBaseActivityLog {
    _id: string;
    timestamp: Date;
    entityId: string;
    userId: string;
}

interface IEmptyMetadata extends IBaseActivityLog {
    action: 'CREATE_ENTITY' | 'DISABLE_ENTITY' | 'ACTIVATE_ENTITY' | 'VIEW_ENTITY' | 'CREATE_PROCESS';
    metadata: {};
}

interface IRelationshipMetadata extends IBaseActivityLog {
    action: 'DELETE_RELATIONSHIP' | 'CREATE_RELATIONSHIP';
    metadata: { relationshipId: string; relationshipTemplateId: string; entityId: string };
}

interface IDuplicateEntityMetadata extends IBaseActivityLog {
    action: 'DUPLICATE_ENTITY';
    metadata: { entityIdDuplicatedFrom: string };
}

interface IUpdateEntityMetadata extends IBaseActivityLog {
    action: 'UPDATE_ENTITY' | 'UPDATE_PROCESS';
    metadata: { updatedFields: [{ fieldName: string; oldValue: any; newValue: any }] };
}

export interface IUpdateProcessStepMetadata extends IBaseActivityLog {
    action: 'UPDATE_PROCESS_STEP';
    metadata: { updatedFields?: [{ fieldName: string; oldValue: any; newValue: any }]; comments?: string; status?: Status };
}

export type IActivityLog = IEmptyMetadata | IRelationshipMetadata | IDuplicateEntityMetadata | IUpdateEntityMetadata | IUpdateProcessStepMetadata;

const getActivityLogRequest = async (
    entityId: string,
    limit: number,
    skip: number,
    entityTemplateProperties: Record<string, IEntitySingleProperty> | Record<string, IProcessSingleProperty>,
    actions?: string[],
    searchText?: string,
    startDateRange?: Date,
    endDateRange?: Date,
) => {
    let actionsToFilter = actions;
    if (actions?.includes('UPDATE_FIELDS')) {
        actionsToFilter = actions.filter((action) => action !== 'UPDATE_FIELDS');
        actionsToFilter.push(...['UPDATE_ENTITY', 'UPDATE_PROCESS', 'UPDATE_PROCESS_STEP']);
    }

    const params: Partial<{
        limit: number;
        skip: number;
        actions: string[];
        searchText: string;
        fieldsSearch: string[];
        startDateRange: Date;
        endDateRange: Date;
    }> = {
        limit,
        skip,
        actions: actionsToFilter,
        startDateRange,
        endDateRange,
    };

    const trimmedSearchText = searchText?.trim();

    if (trimmedSearchText && trimmedSearchText !== '') {
        params.searchText = searchText;

        const fieldsKeysToSearch = Object.keys(entityTemplateProperties).filter((key) =>
            entityTemplateProperties[key].title.includes(trimmedSearchText),
        );

        params.fieldsSearch = fieldsKeysToSearch;
    }

    const { data } = await axios.get<IActivityLog[]>(`${activityLog}/${entityId}`, { params });
    return data;
};

export { getActivityLogRequest };

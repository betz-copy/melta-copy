import { ActionsLog, IMongoActivityLog } from '@packages/activity-log';
import { IEntitySingleProperty } from '@packages/entity-template';
import { IProcessSingleProperty } from '@packages/process';
import axios from '../axios';
import { environment } from '../globals';

const { activityLog } = environment.api;

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
    if (actions?.includes(ActionsLog.UPDATE_FIELDS)) {
        actionsToFilter = actions.filter((action) => action !== ActionsLog.UPDATE_FIELDS);
        actionsToFilter.push(...[ActionsLog.UPDATE_ENTITY, ActionsLog.UPDATE_PROCESS, ActionsLog.UPDATE_PROCESS_STEP]);
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

    const { data } = await axios.get<IMongoActivityLog[]>(`${activityLog}/${entityId}`, { params });
    return data;
};

export { getActivityLogRequest };

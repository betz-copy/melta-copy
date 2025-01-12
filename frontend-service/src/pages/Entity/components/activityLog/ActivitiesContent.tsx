import { Divider, Grid } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import { toast } from 'react-toastify';
import { InfiniteScroll } from '../../../../common/InfiniteScroll';
import { environment } from '../../../../globals';
import { IEntityExpanded } from '../../../../interfaces/entities';
import { IMongoEntityTemplatePopulated } from '../../../../interfaces/entityTemplates';
import { getActivityLogRequest, IActivityLog } from '../../../../services/activityLogService';
import ActivityLogRow from './ActivityLogRow';
import { IProcessDetails } from '../../../../interfaces/processes/processTemplate';

const { infiniteScrollPageCount } = environment.activityLog;

const ActivitiesContent: React.FC<{
    expandedEntity?: IEntityExpanded;
    entityTemplate: IMongoEntityTemplatePopulated | IProcessDetails;
    activityEntityId?: string;
}> = ({ expandedEntity, entityTemplate, activityEntityId }) => {
    const entityId = expandedEntity?.entity.properties._id || activityEntityId || '';

    return (
        <InfiniteScroll<IActivityLog>
            queryKey={['getActivityLogRequest', entityId]}
            queryFunction={({ pageParam }) =>
                getActivityLogRequest(entityId, infiniteScrollPageCount, pageParam, [
                    'DELETE_RELATIONSHIP',
                    'CREATE_RELATIONSHIP',
                    'UPDATE_ENTITY',
                    'CREATE_ENTITY',
                    'UPDATE_PROCESS',
                    'CREATE_PROCESS',
                    'DUPLICATE_ENTITY',
                    'DISABLE_ENTITY',
                    'ACTIVATE_ENTITY',
                ])
            }
            onQueryError={(error) => {
                // eslint-disable-next-line no-console
                console.log('failed to get activities. error:', error);
                toast.error(i18next.t('entityPage.activityLog.failedToGetActivities'));
            }}
            getNextPageParam={(lastPage, allPages) => {
                const nextPage = allPages.length * infiniteScrollPageCount;
                return lastPage.length ? nextPage : undefined;
            }}
            endText={i18next.t('entityPage.activityLog.noSearchLeft')}
        >
            {(activityLog) => (
                <>
                    <ActivityLogRow log={activityLog} entityTemplate={entityTemplate} />
                    <Divider variant="middle" style={{ marginTop: '7px' }} />
                </>
            )}
        </InfiniteScroll>
    );
};

export { ActivitiesContent };

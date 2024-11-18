import { History } from '@mui/icons-material';
import { Button, Divider } from '@mui/material';
import i18next from 'i18next';
import React, { useEffect } from 'react';
import { toast } from 'react-toastify';
import { IEntityExpanded, IMongoEntityTemplatePopulated } from '@microservices/shared';
import { InfiniteScroll } from '../../../../common/InfiniteScroll';
import { MeltaTooltip } from '../../../../common/MeltaTooltip';
import PopperSidebar from '../../../../common/PopperSidebar';
import { environment } from '../../../../globals';
import { getActivityLogRequest, IActivityLog } from '../../../../services/activityLogService';
import ActivityLogRow from './ActivityLogRow';

const { infiniteScrollPageCount } = environment.activityLog;

const ActivityLog: React.FC<{ expandedEntity: IEntityExpanded; entityTemplate: IMongoEntityTemplatePopulated }> = ({
    expandedEntity,
    entityTemplate,
}) => {
    const [openPopper, setOpenPopper] = React.useState(false);
    const entityId = expandedEntity.entity.properties._id;
    useEffect(() => {
        setOpenPopper(false);
    }, [entityId]);

    return (
        <>
            <MeltaTooltip title={i18next.t('entityPage.activityLog.header')}>
                <Button
                    variant="contained"
                    startIcon={<History />}
                    onClick={() => setOpenPopper((previousOpen) => !previousOpen)}
                    sx={{ marginLeft: '1rem' }}
                >
                    {i18next.t('entityPage.activityLog.header')}
                </Button>
            </MeltaTooltip>

            <PopperSidebar open={openPopper} setOpen={setOpenPopper} title={i18next.t('entityPage.activityLog.header')} side="left">
                <InfiniteScroll<IActivityLog>
                    queryKey={['getActivityLogRequest', entityId]}
                    queryFunction={({ pageParam }) =>
                        getActivityLogRequest(entityId, infiniteScrollPageCount, pageParam, [
                            'DELETE_RELATIONSHIP',
                            'CREATE_RELATIONSHIP',
                            'UPDATE_ENTITY',
                            'CREATE_ENTITY',
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
            </PopperSidebar>
        </>
    );
};

export { ActivityLog };

import React, { useEffect } from 'react';
import i18next from 'i18next';
import { toast } from 'react-toastify';
import { Box, Button, Divider } from '@mui/material';
import IconButtonWithPopover from '../../../../common/IconButtonWithPopover';
import { IEntityExpanded } from '../../../../interfaces/entities';
import { IMongoEntityTemplatePopulated } from '../../../../interfaces/entityTemplates';
import PopperSidebar from '../../../../common/PopperSidebar';
import { InfiniteScroll } from '../../../../common/InfiniteScroll';
import { getActivityLogRequest, IActivityLog } from '../../../../services/activityLogService';
import ActivityLogRow from './ActivityLogRow';
import { environment } from '../../../../globals';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import { TabContext, TabList, TabPanel } from '@mui/lab';

const { infiniteScrollPageCount } = environment.activityLog;

const ActivityLog: React.FC<{ expandedEntity: IEntityExpanded; entityTemplate: IMongoEntityTemplatePopulated }> = ({
    expandedEntity,
    entityTemplate,
}) => {
    const [openPopper, setOpenPopper] = React.useState(false);
    const types = [i18next.t('entityPage.activityLog.actions'), i18next.t('entityPage.activityLog.viewers')];
    const entityId = expandedEntity.entity.properties._id;
    useEffect(() => {
        setOpenPopper(false);
    }, [entityId]);
    const [tab, setValue] = React.useState(types[0]);

    const handleChange = (event: React.SyntheticEvent, newValue: string) => {
        setValue(newValue);
    };

    return (
        <>
            <IconButtonWithPopover
                popoverText={i18next.t('entityPage.activityLog.header')}
                iconButtonProps={{ onClick: () => setOpenPopper((previousOpen) => !previousOpen) }}
            >
                <img src="/icons/history.svg" />
            </IconButtonWithPopover>
            <PopperSidebar open={openPopper} setOpen={setOpenPopper} title={i18next.t('entityPage.activityLog.header')} side="left">
                <TabContext value={tab}>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <TabList onChange={handleChange} aria-label="basic tabs example" centered>
                            <Tab label={types[0]} value={types[0]}/>
                            <Tab label={types[1]} value={types[1]}/>
                        </TabList>
                    </Box>
                    <TabPanel value={types[0]}><InfiniteScroll<IActivityLog>
                        queryKey={['getActivityLogRequest', entityId]}
                        queryFunction={({ pageParam }) => getActivityLogRequest(entityId, infiniteScrollPageCount, pageParam)}
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
                    </InfiniteScroll></TabPanel>
                    <TabPanel value={types[1]}><InfiniteScroll<IActivityLog>
                        queryKey={['getActivityLogRequest', entityId]}
                        queryFunction={({ pageParam }) => getActivityLogRequest(entityId, infiniteScrollPageCount, pageParam, ['VIEW_ENTITY'])}

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
                    </InfiniteScroll></TabPanel>
                </TabContext>

            </PopperSidebar>
        </>
    );
};

export { ActivityLog };

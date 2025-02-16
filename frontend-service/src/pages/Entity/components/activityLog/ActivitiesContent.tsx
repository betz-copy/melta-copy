import { Box, Divider, Grid, IconButton, useTheme } from '@mui/material';
import i18next from 'i18next';
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { Search } from '@mui/icons-material';
import { InfiniteScroll } from '../../../../common/InfiniteScroll';
import { environment } from '../../../../globals';
import { IEntityExpanded } from '../../../../interfaces/entities';
import { IMongoEntityTemplatePopulated } from '../../../../interfaces/entityTemplates';
import { getActivityLogRequest, IActivityLog } from '../../../../services/activityLogService';
import ActivityLogRow from './ActivityLogRow';
import { IProcessDetails } from '../../../../interfaces/processes/processTemplate';
import { IMongoStepTemplatePopulated } from '../../../../interfaces/processes/stepTemplate';
import SearchInput from '../../../../common/inputs/SearchInput';

const { infiniteScrollPageCount } = environment.activityLog;

const ACTIVITY_TYPES = [
    'DELETE_RELATIONSHIP',
    'CREATE_RELATIONSHIP',
    'UPDATE_ENTITY',
    'CREATE_ENTITY',
    'UPDATE_PROCESS',
    'CREATE_PROCESS',
    'DUPLICATE_ENTITY',
    'DISABLE_ENTITY',
    'ACTIVATE_ENTITY',
    'UPDATE_PROCESS_STEP',
];

const getNextPageParam = (lastPage: IActivityLog[], allPages: IActivityLog[][]) => {
    const nextPage = allPages.length * infiniteScrollPageCount;
    return lastPage.length ? nextPage : undefined;
};

const ActivitiesContent: React.FC<{
    expandedEntity?: IEntityExpanded;
    entityTemplate: IMongoEntityTemplatePopulated | IProcessDetails | IMongoStepTemplatePopulated;
    activityEntityId?: string;
}> = ({ expandedEntity, entityTemplate, activityEntityId }) => {
    const entityId = expandedEntity?.entity.properties._id || activityEntityId || '';

    const [searchInput, setSearchInput] = useState('');
    console.log({ searchInput });
    const theme = useTheme();

    return (
        <Grid container justifyContent="center">
            <Grid item sx={{ borderRadius: '7px', width: 'fit-content', boxShadow: '3' }}>
                <SearchInput
                    onChange={setSearchInput}
                    borderRadius="7px"
                    placeholder={i18next.t('globalSearch.searchInHistory')}
                    value={searchInput}
                    endAdornmentChildren={
                        <Box>
                            <IconButton sx={{ color: theme.palette.primary.main, padding: 0 }} disableRipple>
                                <Search sx={{ fontSize: '1.25rem' }} />
                            </IconButton>
                        </Box>
                    }
                    toTopBar={false}
                />
            </Grid>
            <Grid item marginTop="20px">
                <InfiniteScroll<IActivityLog>
                    queryKey={['getActivityLogRequest', entityId]}
                    queryFunction={({ pageParam }) => getActivityLogRequest(entityId, infiniteScrollPageCount, pageParam, ACTIVITY_TYPES)}
                    onQueryError={(error) => {
                        // eslint-disable-next-line no-console
                        console.log('failed to get activities. error:', error);
                        toast.error(i18next.t('entityPage.activityLog.failedToGetActivities'));
                    }}
                    getNextPageParam={getNextPageParam}
                    endText={i18next.t('entityPage.activityLog.noSearchLeft')}
                >
                    {(activityLog) => (
                        <>
                            <ActivityLogRow log={activityLog} entityTemplate={entityTemplate} />
                            <Divider variant="middle" style={{ marginTop: '7px' }} />
                        </>
                    )}
                </InfiniteScroll>
            </Grid>
        </Grid>
    );
};

export { ActivitiesContent };

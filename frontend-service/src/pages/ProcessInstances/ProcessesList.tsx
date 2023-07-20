import { Grid, Typography } from '@mui/material';

import React, { useState } from 'react';
import i18next from 'i18next';
import { toast } from 'react-toastify';
import { ViewingBox } from '../SystemManagement/components/ViewingBox';
import ProcessCard, { StatusColors } from './ProcessCard';
import { searchProcessesRequest } from '../../services/processesService';
import { FiberManualRecordOutlined as StatusIcon } from '@mui/icons-material';
import { FiberManualRecord as StatusIconFilled } from '@mui/icons-material';
import { environment } from '../../globals';
import IconButton from '@mui/material/IconButton';
import { Status } from '../../interfaces/processes/processInstance';
import './ProcessesList.css';

import { IMongoProcessTemplatePopulated } from '../../interfaces/processes/processTemplate';
import { InfiniteScroll } from '../../common/InfiniteScroll';
import { IMongoProcessInstancePopulated } from '../../interfaces/processes/processInstance';
import { useQueryClient } from 'react-query';

const { infiniteScrollPageCount } = environment.processInstances;

const ProcessesList: React.FC<{
    onSetStartDate: (newStartDateInput: Date) => void;
    onSetEndDate: (newEndDateInput: Date) => void;
    search: string;
    startDateInput: Date | null;
    endDateInput: Date | null;
    templatesToShowCheckbox: IMongoProcessTemplatePopulated[]; // todo: support in backend
}> = ({ templatesToShowCheckbox, search, startDateInput, endDateInput }) => {
    const [statusFilter, setStatusFilter] = useState<'all' | Status>('all');
    const queryClient = useQueryClient();
    return (
        <Grid container direction="column" spacing={2}>
            <Grid item container id="processesFilter" alignItems="center" spacing={3}>
                <Grid item>
                    <Typography variant="h6">{i18next.t('processInstancesPage.filter')}</Typography>
                </Grid>
                <Grid item>
                    <IconButton sx={{ flexDirection: 'column', width: '60px' }} onClick={() => setStatusFilter('all')}>
                        {statusFilter === 'all' ? (
                            <StatusIconFilled fontSize="medium" sx={{ color: 'grey' }} />
                        ) : (
                            <StatusIcon fontSize="medium" sx={{ color: 'grey' }} />
                        )}

                        <Typography variant="subtitle2" fontSize="10px">
                            {i18next.t('processInstancesPage.allProcesses')}
                        </Typography>
                    </IconButton>
                    <IconButton sx={{ flexDirection: 'column', width: '60px' }} onClick={() => setStatusFilter(Status.Pending)}>
                        {statusFilter === Status.Pending ? (
                            <StatusIconFilled fontSize="medium" sx={{ color: `${StatusColors.Pending}` }} />
                        ) : (
                            <StatusIcon fontSize="medium" sx={{ color: `${StatusColors.Pending}` }} />
                        )}

                        <Typography variant="subtitle2" fontSize="10px">
                            {i18next.t('processInstancesPage.pendingProcesses')}
                        </Typography>
                    </IconButton>
                    <IconButton sx={{ flexDirection: 'column', width: '60px' }} onClick={() => setStatusFilter(Status.Approved)}>
                        {statusFilter === Status.Approved ? (
                            <StatusIconFilled fontSize="medium" sx={{ color: `${StatusColors.Approved}` }} />
                        ) : (
                            <StatusIcon fontSize="medium" sx={{ color: `${StatusColors.Approved}` }} />
                        )}
                        <Typography variant="subtitle2" fontSize="10px">
                            {i18next.t('processInstancesPage.approvedProcesses')}
                        </Typography>
                    </IconButton>
                    <IconButton sx={{ flexDirection: 'column', width: '60px' }} onClick={() => setStatusFilter(Status.Rejected)}>
                        {statusFilter === Status.Rejected ? (
                            <StatusIconFilled fontSize="medium" sx={{ color: `${StatusColors.Rejected}` }} />
                        ) : (
                            <StatusIcon fontSize="medium" sx={{ color: `${StatusColors.Rejected}` }} />
                        )}
                        <Typography variant="subtitle2" fontSize="10px">
                            {i18next.t('processInstancesPage.rejectedProcesses')}
                        </Typography>
                    </IconButton>
                </Grid>
            </Grid>
            <Grid item>
                <ViewingBox minHeight="80vh">
                    <InfiniteScroll<IMongoProcessInstancePopulated>
                        queryKey={['searchProcesses', templatesToShowCheckbox, search, startDateInput, endDateInput, statusFilter]}
                        queryFunction={({ pageParam }) => {
                            return searchProcessesRequest({
                                name: search,
                                templateIds: templatesToShowCheckbox.map((template) => template._id),
                                startDate: startDateInput ?? undefined,
                                endDate: endDateInput ?? undefined,
                                status: statusFilter !== 'all' ? statusFilter : undefined,
                                skip: pageParam,
                                limit: infiniteScrollPageCount,
                            });
                        }}
                        onQueryError={(error) => {
                            // eslint-disable-next-line no-console
                            console.log('failed loading all processes:', error);
                            toast.error(i18next.t('processInstancesPage.failedToLoadAllProcesses'));
                        }}
                        getNextPageParam={(lastPage, allPages) => {
                            const nextPage = allPages.length * infiniteScrollPageCount;
                            return lastPage.length ? nextPage : undefined;
                        }}
                        emptyText={i18next.t('processInstancesPage.noInstancesFound')}
                        useContainer={false}
                    >
                        {(process) => (
                            <ProcessCard
                                processInstance={process}
                                onChangedProcessDialogClose={() => {
                                    queryClient.resetQueries({ queryKey: ['searchProcesses'] });
                                }}
                            />
                        )}
                    </InfiniteScroll>
                </ViewingBox>
            </Grid>
        </Grid>
    );
};

export default ProcessesList;

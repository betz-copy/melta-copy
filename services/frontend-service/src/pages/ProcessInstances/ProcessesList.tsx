import React, { useState } from 'react';
import { Grid, Typography } from '@mui/material';
import i18next from 'i18next';
import { toast } from 'react-toastify';
import { FiberManualRecordOutlined as StatusIcon, FiberManualRecord as StatusIconFilled } from '@mui/icons-material';
import IconButton from '@mui/material/IconButton';
import { useQueryClient } from 'react-query';
import { Status, IMongoProcessInstanceReviewerPopulated, PermissionScope, IMongoProcessTemplateReviewerPopulated } from '@microservices/shared';
import { ViewingBox } from '../SystemManagement/components/ViewingBox';
import ProcessCard, { StatusColors } from './ProcessCard';
import { searchProcessesRequest } from '../../services/processesService';
import { environment } from '../../globals';
import { InfiniteScroll } from '../../common/InfiniteScroll';
import './ProcessesList.css';
import { useUserStore } from '../../stores/user';

const { infiniteScrollPageCount } = environment.processInstances;

const ProcessesList: React.FC<{
    onSetStartDate: (newStartDateInput: Date) => void;
    onSetEndDate: (newEndDateInput: Date) => void;
    search: string;
    startDateInput: Date | null;
    endDateInput: Date | null;
    templatesToShowCheckbox: IMongoProcessTemplateReviewerPopulated[]; // todo: support in backend
}> = ({ templatesToShowCheckbox, search, startDateInput, endDateInput }) => {
    const [statusFilter, setStatusFilter] = useState<'all' | Status | undefined>('all');

    const queryClient = useQueryClient();

    const currentUser = useUserStore((state) => state.user);

    const hasPermissionsToEditDetails =
        currentUser.currentWorkspacePermissions.processes?.scope === PermissionScope.write ||
        currentUser.currentWorkspacePermissions.admin?.scope === PermissionScope.write;

    const getStatusFilter = (status: Status | 'all' | undefined) => {
        if (status === 'all') return [Status.Approved, Status.Pending, Status.Rejected];
        if (status !== undefined) return [status];
        return undefined;
    };

    const [loadingProcesses, setLoadingProcesses] = useState<Record<string, boolean>>({});

    return (
        <Grid container direction="column" spacing={2}>
            <Grid item container id="processesFilter" alignItems="center" spacing={3}>
                <Grid item>
                    <Typography variant="h6">{i18next.t('processInstancesPage.filter')}</Typography>
                </Grid>
                <Grid item>
                    <IconButton sx={{ flexDirection: 'column', width: '60px' }} onClick={() => setStatusFilter('all')}>
                        {statusFilter === 'all' ? (
                            <StatusIconFilled fontSize="medium" sx={{ color: `${StatusColors.All}` }} />
                        ) : (
                            <StatusIcon fontSize="medium" sx={{ color: `${StatusColors.All}` }} />
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
                    <IconButton sx={{ flexDirection: 'column', width: '60px' }} onClick={() => setStatusFilter(undefined)}>
                        {!statusFilter ? (
                            <StatusIconFilled fontSize="medium" sx={{ color: `${StatusColors.Archived}` }} />
                        ) : (
                            <StatusIcon fontSize="medium" sx={{ color: `${StatusColors.Archived}` }} />
                        )}

                        <Typography variant="subtitle2" fontSize="10px">
                            {i18next.t('processInstancesPage.archivedProcesses')}
                        </Typography>
                    </IconButton>
                </Grid>
            </Grid>
            <Grid item>
                <ViewingBox minHeight="80vh">
                    <InfiniteScroll<IMongoProcessInstanceReviewerPopulated>
                        queryKey={['searchProcesses', templatesToShowCheckbox, search, startDateInput, endDateInput, statusFilter]}
                        queryFunction={({ pageParam }) => {
                            return searchProcessesRequest({
                                searchText: search,
                                templateIds: templatesToShowCheckbox.map((template) => template._id),
                                startDate: startDateInput ?? undefined,
                                endDate: endDateInput ?? undefined,
                                status: getStatusFilter(statusFilter),
                                skip: pageParam,
                                limit: infiniteScrollPageCount,
                                archived: statusFilter === undefined,
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
                                onChangedProcessDialogClose={(processId: string | null) => {
                                    if (processId) {
                                        setLoadingProcesses((prev) => ({ ...prev, [processId]: true }));
                                        queryClient
                                            .invalidateQueries(['searchProcesses'])
                                            .finally(() => setLoadingProcesses((prev) => ({ ...prev, [processId]: false })));
                                    } else queryClient.resetQueries({ queryKey: ['searchProcesses'] });
                                }}
                                isLoading={loadingProcesses[process._id] || false}
                                isEditMode={hasPermissionsToEditDetails}
                            />
                        )}
                    </InfiniteScroll>
                </ViewingBox>
            </Grid>
        </Grid>
    );
};

export default ProcessesList;

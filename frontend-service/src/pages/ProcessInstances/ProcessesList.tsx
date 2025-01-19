import React, { useEffect, useState } from 'react';
import { Grid } from '@mui/material';
import i18next from 'i18next';
import { toast } from 'react-toastify';
import { useQueryClient } from 'react-query';
import { ViewingBox } from '../SystemManagement/components/ViewingBox';
import ProcessCard from './ProcessCard';
import { searchProcessesRequest } from '../../services/processesService';
import { Status, IMongoProcessInstancePopulated } from '../../interfaces/processes/processInstance';
import { IMongoProcessTemplatePopulated } from '../../interfaces/processes/processTemplate';
import { InfiniteScroll } from '../../common/InfiniteScroll';
import './ProcessesList.css';
import { useUserStore } from '../../stores/user';
import { PermissionScope } from '../../interfaces/permissions';
import { useDarkModeStore } from '../../stores/darkMode';
import { BlueTitle } from '../../common/BlueTitle';
import { environment } from '../../globals';

const { infiniteScrollPageCount } = environment.processInstances;

const ProcessesList: React.FC<{
    onSetStartDate: (newStartDateInput: Date) => void;
    onSetEndDate: (newEndDateInput: Date) => void;
    search: string;
    startDateInput: Date | null;
    endDateInput: Date | null;
    templatesToShowCheckbox: IMongoProcessTemplatePopulated[]; // todo: support in backend
    statusFilter: 'all' | Status | 'archived';
    isWaitingForMeFilterOn: boolean;
}> = ({ templatesToShowCheckbox, search, startDateInput, endDateInput, statusFilter, isWaitingForMeFilterOn }) => {
    const queryClient = useQueryClient();

    const currentUser = useUserStore((state) => state.user);

    const darkMode = useDarkModeStore((state) => state.darkMode);

    const hasPermissionsToEditDetails =
        currentUser.currentWorkspacePermissions.processes?.scope === PermissionScope.write ||
        currentUser.currentWorkspacePermissions.admin?.scope === PermissionScope.write;

    const getStatusFilter = (status: Status | 'all' | 'archived') => {
        if (status === 'all') return [Status.Approved, Status.Pending, Status.Rejected];
        if (status !== 'archived') return [status];
        return undefined;
    };

    const [loadingProcesses, setLoadingProcesses] = useState<Record<string, boolean>>({});
    const [waitingForMeProcesses, setWaitingForMeProcesses] = useState<IMongoProcessInstancePopulated[]>([]);

    useEffect(() => {
        if (isWaitingForMeFilterOn) {
            searchProcessesRequest({
                searchText: search,
                templateIds: templatesToShowCheckbox.map((template) => template._id),
                startDate: startDateInput ?? undefined,
                endDate: endDateInput ?? undefined,
                skip: 0,
                limit: 0,
                archived: false,
                isWaitingForMeFilterOn: true,
                isStepStatusPendeing: true,
            }).then((processes) => setWaitingForMeProcesses(processes));
        }
    }, [isWaitingForMeFilterOn, search, templatesToShowCheckbox, startDateInput, endDateInput]);

    return (
        <Grid item container direction="column" spacing={2}>
            {waitingForMeProcesses.length > 0 && isWaitingForMeFilterOn && (
                <Grid
                    item
                    container
                    flexDirection="column"
                    marginTop="15px"
                    style={{ backgroundColor: darkMode ? '#434343' : '#CCCFE5', borderRadius: '20px', padding: '15px' }}
                    rowGap={3}
                >
                    <Grid item>
                        <BlueTitle
                            component="h4"
                            variant="h6"
                            style={{ fontSize: '16px', fontWeight: '600' }}
                            title={i18next.t('processInstancesPage.waitForMyApprove')}
                        />
                    </Grid>
                    <Grid item>
                        <ViewingBox minHeight="80vh">
                            {waitingForMeProcesses.map((process) => (
                                <Grid item key={process._id}>
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
                                </Grid>
                            ))}
                        </ViewingBox>
                    </Grid>
                </Grid>
            )}
            <Grid item>
                <ViewingBox minHeight="80vh">
                    <InfiniteScroll<IMongoProcessInstancePopulated>
                        queryKey={[
                            'searchProcesses',
                            templatesToShowCheckbox,
                            search,
                            startDateInput,
                            endDateInput,
                            statusFilter,
                            isWaitingForMeFilterOn,
                        ]}
                        queryFunction={({ pageParam }) => {
                            return searchProcessesRequest({
                                searchText: search,
                                templateIds: templatesToShowCheckbox.map((template) => template._id),
                                startDate: startDateInput ?? undefined,
                                endDate: endDateInput ?? undefined,
                                status: getStatusFilter(statusFilter),
                                skip: pageParam,
                                limit: infiniteScrollPageCount,
                                archived: statusFilter === 'archived',
                                isWaitingForMeFilterOn,
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

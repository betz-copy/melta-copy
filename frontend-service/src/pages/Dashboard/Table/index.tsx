/* eslint-disable react/no-unstable-nested-components */
import { CircularProgress } from '@mui/material';
import { AxiosError } from 'axios';
import i18next from 'i18next';
import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { useLocation, useParams } from 'wouter';
import { ErrorToast } from '../../../common/ErrorToast';
import { StepType } from '../../../common/wizards';
import { DashboardItemType, TableMetaData, ViewMode } from '../../../interfaces/dashboard';
import { createDashboardItem, deleteDashboardItem, editDashboardItem, getDashboardItemById } from '../../../services/dashboardService';
import { dashboardInitialValues, tableDetailsSchema } from '../../../utils/dashboard/formik';
import { FilterSideBar } from '../../Charts/ChartPage/filterSideBar';
import { DashboardItem } from '../pages';
import { BodyComponent } from './BodyCompenet';
import { SideBarDetails } from './sideBarDetails';

const Table: React.FC = () => {
    const { tableId } = useParams<{ tableId: string }>();
    const [_, navigate] = useLocation();

    const [viewMode, setViewMode] = useState<ViewMode>(tableId ? ViewMode.ReadOnly : ViewMode.Add);

    const queryClient = useQueryClient();
    const { data: table, isLoading: isLoadingGetTable } = useQuery(['getTable', tableId], () => getDashboardItemById(tableId!), {
        enabled: !!tableId,
    });

    useEffect(() => {
        if (tableId && table) setViewMode(ViewMode.ReadOnly);
    }, [tableId, table]);

    const { isLoading, mutateAsync } = useMutation(
        (tableData: TableMetaData) =>
            viewMode === ViewMode.Edit
                ? editDashboardItem(tableId!, { type: DashboardItemType.Table, metaData: tableData as TableMetaData })
                : createDashboardItem({ type: DashboardItemType.Table, metaData: tableData as TableMetaData }),

        {
            onSuccess: async (data) => {
                if (viewMode === ViewMode.Edit) {
                    queryClient.invalidateQueries(['getTable', tableId]);
                    setViewMode(ViewMode.ReadOnly);
                } else {
                    navigate(`/table/${data._id}`);
                }

                toast.success(i18next.t(viewMode === ViewMode.Edit ? 'wizard.category.editedSuccessfully' : 'wizard.category.createdSuccessfully'));
            },
            onError: (error: AxiosError) => {
                toast.error(
                    <ErrorToast
                        axiosError={error}
                        defaultErrorMessage={
                            ViewMode.Edit ? i18next.t('wizard.entityTemplate.failedToEdit') : i18next.t('wizard.entityTemplate.failedToCreate')
                        }
                    />,
                );
            },
        },
    );

    const { mutateAsync: deleteMutateAsync } = useMutation(() => deleteDashboardItem(tableId), {
        onSuccess: () => {
            navigate('/');
            toast.success(i18next.t('charts.actions.deletedSuccessfully'));
        },
        onError: (error: AxiosError) => {
            toast.error(<ErrorToast axiosError={error} defaultErrorMessage={i18next.t('charts.actions.failedToDelete')} />);
        },
    });

    const steps: StepType<TableMetaData>[] = [
        {
            label: i18next.t('charts.generalDetails'),
            component: (props) => <SideBarDetails {...props} />,
            validationSchema: tableDetailsSchema,
        },
        {
            label: i18next.t('charts.filterDetails'),
            component: (props) => <FilterSideBar {...props} />,
            validationSchema: undefined,
        },
    ];

    if (isLoadingGetTable) return <CircularProgress />;

    return (
        <DashboardItem<TableMetaData>
            title={viewMode === ViewMode.Add ? i18next.t('dashboard.tables.addTable') : i18next.t('dashboard.tables.editTable')}
            backPath={{ path: '/', title: 'מסך ראשי' }}
            onDelete={deleteMutateAsync}
            steps={steps}
            initialValues={table ? table.metaData : dashboardInitialValues.table}
            bodyComponent={(props) => <BodyComponent {...props} />}
            submitFunction={(values) => mutateAsync(values)}
            isLoading={isLoading}
            viewMode={{
                value: viewMode,
                set: setViewMode,
            }}
        />
    );
};

export default Table;

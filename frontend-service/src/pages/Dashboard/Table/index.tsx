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
import { environment } from '../../../globals';
import { DashboardItemType, TableForm, ViewMode } from '../../../interfaces/dashboard';
import { IGraphFilterBodyBatch } from '../../../interfaces/entities';
import { IEntityTemplateMap } from '../../../interfaces/entityTemplates';
import { createDashboardItem, deleteDashboardItem, editDashboardItem, getDashboardItemById } from '../../../services/dashboardService';
import { dashboardInitialValues, tableDetailsSchema, tableMetaDataToBackend } from '../../../utils/dashboard/formik';
import { FilterSideBar } from '../../Charts/ChartPage/filterSideBar';
import { FilterOfGraphToFilterRecord } from '../../Graph/GraphFilterToBackend';
import { DashboardItem } from '../DashboardItem';
import { BodyComponent } from './BodyComponent';
import { SideBarDetails } from './sideBarDetails';

const { dashboardPath, tablePath } = environment.dashboard;

const Table: React.FC = () => {
    const { tableId } = useParams<{ tableId: string }>();
    const [_, navigate] = useLocation();

    const queryClient = useQueryClient();

    const { data: table, isLoading: isLoadingGetTable } = useQuery(['getTable', tableId], () => getDashboardItemById(tableId!), {
        enabled: !!tableId,
    });

    const [viewMode, setViewMode] = useState<ViewMode>(tableId ? ViewMode.ReadOnly : ViewMode.Add);
    const [filters, setFilters] = useState<number[]>([]);
    const [filterRecord, setFilterRecord] = useState<IGraphFilterBodyBatch>({});

    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;

    const template = table && entityTemplates.get(table?.metaData.templateId);

    const updateFilters = (filter: string) => {
        const parsedFilter = JSON.parse(filter);
        const formattedFilter = FilterOfGraphToFilterRecord(parsedFilter, template!);

        setFilterRecord(formattedFilter);
        setFilters(Object.keys(formattedFilter).map(Number));
    };

    useEffect(() => {
        if (tableId && table) setViewMode(ViewMode.ReadOnly);
    }, [tableId, table]);

    useEffect(() => {
        if (table && template && table.metaData.filter) updateFilters(table.metaData.filter);
    }, [table, template]);

    const { isLoading, mutateAsync } = useMutation(
        (tableData: TableForm) =>
            viewMode === ViewMode.Edit
                ? editDashboardItem(tableId!, tableMetaDataToBackend(tableData))
                : createDashboardItem(tableMetaDataToBackend(tableData)),

        {
            onSuccess: async (data) => {
                if (viewMode === ViewMode.Edit) {
                    queryClient.setQueryData(['getTable', tableId], data);
                    setViewMode(ViewMode.ReadOnly);
                    if (data.type === DashboardItemType.Table && data.metaData.filter) updateFilters(data.metaData.filter);
                } else {
                    navigate(`${tablePath}/${data._id}`);
                }

                toast.success(i18next.t(`dashboard.tables.${viewMode === ViewMode.Edit ? 'edited' : 'created'}Successfully`));
            },
            onError: (error: AxiosError) => {
                toast.error(
                    <ErrorToast
                        axiosError={error}
                        defaultErrorMessage={i18next.t(`dashboard.tables.failedTo${ViewMode.Edit ? 'Edit' : 'Create'}`)}
                    />,
                );
            },
        },
    );

    const { mutateAsync: deleteMutateAsync } = useMutation(() => deleteDashboardItem(tableId), {
        onSuccess: () => {
            navigate(dashboardPath);
            toast.success(i18next.t('dashboard.tables.deletedSuccessfully'));
        },
        onError: (error: AxiosError) => {
            toast.error(<ErrorToast axiosError={error} defaultErrorMessage={i18next.t('dashboard.tables.failedToDelete')} />);
        },
    });

    const initialValues = table ? { ...table.metaData, filter: filterRecord } : dashboardInitialValues.table;

    const steps: StepType<TableForm>[] = [
        {
            label: i18next.t('charts.generalDetails'),
            component: (props) => <SideBarDetails viewMode={viewMode} {...props} />,
            validationSchema: tableDetailsSchema,
        },
        {
            label: i18next.t('charts.filterDetails'),
            component: (props) => <FilterSideBar filters={{ value: filters, set: setFilters }} viewMode={viewMode} {...props} />,
            validationSchema: undefined,
        },
    ];

    if (isLoadingGetTable) return <CircularProgress />;

    return (
        <DashboardItem<TableForm>
            title={i18next.t(`dashboard.tables.${viewMode === ViewMode.Add ? 'add' : 'edit'}Table`)}
            backPath={{ path: dashboardPath, title: i18next.t('dashboard.mainScreen') }}
            onDelete={deleteMutateAsync}
            steps={steps}
            initialValues={initialValues}
            bodyComponent={(props) => <BodyComponent {...props} />}
            submitFunction={(values) => mutateAsync(values)}
            isLoading={isLoading}
            viewMode={{ value: viewMode, set: setViewMode }}
            onReset={(_values, _formikHelpers) => setFilters(Object.keys(filterRecord).map(Number))}
            type={DashboardItemType.Table}
        />
    );
};

export default Table;

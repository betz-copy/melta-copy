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
import { TableMetaData, ViewMode } from '../../../interfaces/dashboard';
import { IEntityTemplateMap } from '../../../interfaces/entityTemplates';
import { createDashboardItem, deleteDashboardItem, editDashboardItem, getDashboardItemById } from '../../../services/dashboardService';
import { dashboardInitialValues, tableDetailsSchema, tableMetaDataToBackend } from '../../../utils/dashboard/formik';
import { FilterSideBar } from '../../Charts/ChartPage/filterSideBar';
import { FilterOfGraphToFilterRecord } from '../../Graph/GraphFilterToBackend';
import { DashboardItem } from '../DashboardItem';
import { BodyComponent } from './BodyCompenet';
import { SideBarDetails } from './sideBarDetails';
import { IGraphFilterBodyBatch } from '../../../interfaces/entities';

const Table: React.FC = () => {
    const { tableId } = useParams<{ tableId: string }>();
    const [_, navigate] = useLocation();

    const queryClient = useQueryClient();
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;

    const { data: table, isLoading: isLoadingGetTable } = useQuery(['getTable', tableId], () => getDashboardItemById(tableId!), {
        enabled: !!tableId,
    });

    const template = table && entityTemplates.get(table?.metaData.templateId);

    const [viewMode, setViewMode] = useState<ViewMode>(tableId ? ViewMode.ReadOnly : ViewMode.Add);
    const [filters, setFilters] = useState<number[]>([]);
    const [filterRecord, setFilterRecord] = useState<IGraphFilterBodyBatch>({});

    const updateFilters = (filter: string) => {
        const parsedFilter = JSON.parse(filter as unknown as string);
        const formattedFilter = FilterOfGraphToFilterRecord(parsedFilter, template!);

        setFilterRecord(formattedFilter);
        setFilters(Object.keys(formattedFilter).map(Number));
    };

    useEffect(() => {
        if (tableId && table) setViewMode(ViewMode.ReadOnly);
    }, [tableId, table]);

    useEffect(() => {
        if (table && template && table.metaData.filter) updateFilters(table.metaData.filter as unknown as string);
    }, [table, template]);

    const { isLoading, mutateAsync } = useMutation(
        (tableData: TableMetaData) =>
            viewMode === ViewMode.Edit
                ? editDashboardItem(tableId!, tableMetaDataToBackend(tableData))
                : createDashboardItem(tableMetaDataToBackend(tableData)),

        {
            onSuccess: async (data) => {
                if (viewMode === ViewMode.Edit) {
                    queryClient.setQueryData(['getTable', tableId], data);
                    setViewMode(ViewMode.ReadOnly);
                    updateFilters(data.metaData.filter);
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
            component: (props) => <FilterSideBar filters={{ value: filters, set: setFilters }} {...props} />,
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
            initialValues={table ? { ...table.metaData, filter: filterRecord } : dashboardInitialValues.table}
            bodyComponent={(props) => <BodyComponent {...props} />}
            submitFunction={(values) => mutateAsync(values)}
            isLoading={isLoading}
            viewMode={{
                value: viewMode,
                set: setViewMode,
            }}
            onReset={(_values, _formikHelpers) => setFilters(Object.keys(filterRecord).map(Number))}
        />
    );
};

export default Table;

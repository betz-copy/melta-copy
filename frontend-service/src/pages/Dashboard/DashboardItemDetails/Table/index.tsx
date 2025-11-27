import { CircularProgress } from '@mui/material';
import { AxiosError } from 'axios';
import i18next from 'i18next';
import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { useLocation, useParams } from 'wouter';
import { ErrorToast } from '../../../../common/ErrorToast';
import { FilterModelToFilterRecord } from '../../../../common/wizards/entityTemplate/RelationshipReference/TemplateFilterToBackend';
import { environment } from '../../../../globals';
import { DashboardItemType, TableForm, TabStepComponent, ViewMode } from '../../../../interfaces/dashboard';
import { IEntityTemplateMap } from '../../../../interfaces/entityTemplates';
import { createDashboardItem, deleteDashboardItem, editDashboardItem, getDashboardItemById } from '../../../../services/dashboardService';
import { parseFilters } from '../../../../services/templates/entityTemplatesService';
import { dashboardInitialValues, tableDetailsSchema, tableFilterDetailsSchema, tableMetaDataToBackend } from '../../../../utils/dashboard/formik';
import FilterSideBar from '../../../Charts/ChartPage/filterSideBar';
import DashboardItemDetails from '..';
import BodyComponent from './BodyComponent';
import SideBarDetails from './sideBarDetails';

const { dashboardPath, tablePath } = environment.dashboard;

const Table: React.FC = () => {
    const { tableId } = useParams<{ tableId: string }>();
    const [_, navigate] = useLocation();

    const queryClient = useQueryClient();

    const { data: table, isLoading: isLoadingGetTable } = useQuery(['getTable', tableId], () => getDashboardItemById(tableId!), {
        enabled: !!tableId,
    });

    const [viewMode, setViewMode] = useState<ViewMode>(tableId ? ViewMode.ReadOnly : ViewMode.Add);

    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;

    const template = table && entityTemplates.get(table?.metaData.templateId);

    useEffect(() => {
        if (tableId && table) setViewMode(ViewMode.ReadOnly);
    }, [tableId, table]);

    const { isLoading, mutateAsync } = useMutation(
        (tableData: TableForm) =>
            viewMode === ViewMode.Edit
                ? editDashboardItem(tableId!, tableMetaDataToBackend(tableData, queryClient))
                : createDashboardItem(tableMetaDataToBackend(tableData, queryClient)),

        {
            onSuccess: async (data) => {
                if (viewMode === ViewMode.Edit) {
                    queryClient.setQueryData(['getTable', tableId], data);
                    setViewMode(ViewMode.ReadOnly);
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

    const initialValues = table
        ? {
              ...table.metaData,
              _id: table._id,
              filter: table?.metaData.filter
                  ? FilterModelToFilterRecord(parseFilters(table?.metaData.filter), template?._id!, queryClient)
                  : undefined,
          }
        : dashboardInitialValues.table;

    const steps: TabStepComponent<TableForm>[] = [
        {
            label: i18next.t('charts.generalDetails'),
            component: (props) => <SideBarDetails viewMode={viewMode} {...props} />,
            validationSchema: tableDetailsSchema,
        },
        {
            label: i18next.t('charts.filterDetails'),
            component: (props) => <FilterSideBar viewMode={viewMode} {...props} />,
            validationSchema: tableFilterDetailsSchema,
        },
    ];

    if (isLoadingGetTable) return <CircularProgress />;

    return (
        <DashboardItemDetails<TableForm>
            title={i18next.t(`dashboard.tables.${viewMode === ViewMode.Add ? 'add' : 'edit'}Table`)}
            backPath={{ path: dashboardPath, title: i18next.t('dashboard.mainScreen') }}
            onDelete={deleteMutateAsync}
            steps={steps}
            initialValues={initialValues}
            bodyComponent={(props) => <BodyComponent {...props} />}
            submitFunction={(values) => mutateAsync(values)}
            isLoading={isLoading}
            viewMode={{ value: viewMode, set: setViewMode }}
            type={DashboardItemType.Table}
        />
    );
};

export default Table;

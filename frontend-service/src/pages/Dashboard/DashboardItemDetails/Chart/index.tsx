import { CircularProgress } from '@mui/material';
import { IChartPermission, IMongoChart } from '@packages/chart';
import { DashboardItemType } from '@packages/dashboard';
import { AxiosError } from 'axios';
import i18next from 'i18next';
import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { useLocation, useParams } from 'wouter';
import * as Yup from 'yup';
import { ErrorToast } from '../../../../common/ErrorToast';
import { filtersSchema } from '../../../../common/wizards/entityTemplate/AddFields';
import { FilterModelToFilterRecord } from '../../../../common/wizards/entityTemplate/RelationshipReference/TemplateFilterToBackend';
import { environment } from '../../../../globals';
import { ChartForm, TabStepComponent, ViewMode } from '../../../../interfaces/dashboard';
import { IChildTemplateMap, IEntityTemplateMap } from '../../../../interfaces/template';
import { createChart, deleteChart, editChart, getChartById } from '../../../../services/chartsService';
import { createDashboardItem, deleteDashboardItem } from '../../../../services/dashboardService';
import { parseFilters } from '../../../../services/templates/entityTemplatesService';
import { useUserStore } from '../../../../stores/user';
import { chartValidationSchema } from '../../../../utils/charts/getChartAxes';
import { dashboardInitialValues, filterDocumentToFilterBackend } from '../../../../utils/dashboard/formik';
import ChartSideBar from '../../../Charts/ChartPage/ChartSideBar';
import FilterSideBar from '../../../Charts/ChartPage/filterSideBar';
import DashboardItemDetails from '..';
import BodyComponent from './BodyComponent';

const { dashboardPath, chartPath } = environment.dashboard;

const Chart: React.FC = () => {
    const { templateId, chartId } = useParams<{ templateId?: string; chartId?: string }>();
    const [_, navigate] = useLocation();

    const currentUser = useUserStore((state) => state.user);
    const queryClient = useQueryClient();

    const [viewMode, setViewMode] = useState<ViewMode>(chartId ? ViewMode.ReadOnly : ViewMode.Add);

    const { isDashboardPage = false, dashboardId = '' } = window.history.state ?? {};

    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const childTemplates = queryClient.getQueryData<IChildTemplateMap>('getChildTemplates')!;
    const childTemplate = childTemplates.get(templateId ?? '');
    const currTemplateId = childTemplate ? childTemplate.parentTemplate._id : templateId;

    const { data: chart, isLoading: isLoadingGetChart } = useQuery(['getChart', chartId], () => getChartById(chartId!), {
        enabled: !!chartId,
    });

    const { isLoading, mutateAsync } = useMutation({
        mutationFn: async ({ _id, ...chartData }: ChartForm & { _id?: string }) => {
            const baseChart = {
                ...chartData,
                createdBy: currentUser._id,
                filter: filterDocumentToFilterBackend(chartData.templateId!, chartData.filter, queryClient),
            };

            if (viewMode === ViewMode.Edit && chartId) {
                return editChart(chartId, baseChart, chart?.childTemplateId);
            }

            // Add existing chart to dashboard
            if (_id)
                return createDashboardItem({
                    type: DashboardItemType.Chart,
                    metaData: _id,
                });

            return createChart(baseChart, isDashboardPage);
        },
        onSuccess: async (data, chartData) => {
            if (viewMode === ViewMode.Edit) {
                await queryClient.invalidateQueries(['getChart', chartId]);
                setViewMode(ViewMode.ReadOnly);
            } else {
                const newChartId = chartData._id || data._id;
                const newTemplateId = chartData._id
                    ? chartData.childTemplateId || chartData.templateId
                    : (data as IMongoChart).childTemplateId || (data as IMongoChart).templateId;

                navigate(`/charts/${newTemplateId}/${newChartId}/chart`, {
                    state: { isDashboardPage },
                });
            }

            toast.success(i18next.t(`charts.actions.${viewMode === ViewMode.Edit ? 'edited' : 'created'}Successfully`));
        },

        onError: (error: AxiosError) => {
            toast.error(
                <ErrorToast axiosError={error} defaultErrorMessage={i18next.t(`charts.actions.failedTo${ViewMode.Edit ? 'Edit' : 'Create'}`)} />,
            );
        },
    });

    const { mutateAsync: deleteMutateAsync } = useMutation(
        () => (isDashboardPage ? deleteDashboardItem(dashboardId) : deleteChart(chartId!, chart?.usedInDashboard)),
        {
            onSuccess: () => {
                navigate(getBackPath().path);
                toast.success(i18next.t('charts.actions.deletedSuccessfully'));
            },
            onError: (error: AxiosError) => {
                toast.error(<ErrorToast axiosError={error} defaultErrorMessage={i18next.t('charts.actions.failedToDelete')} />);
            },
        },
    );

    const template = chart && entityTemplates.get(chart?.templateId);

    useEffect(() => {
        if (chart && chartId) setViewMode(ViewMode.ReadOnly);
    }, [chartId, chart]);

    const getBackPath = () => {
        const path = isDashboardPage ? dashboardPath : `${chartPath}/${templateId}`;

        const title = `${i18next.t(`dashboard.${isDashboardPage ? 'mainScreen' : 'charts.chartsPage'}`)} ${
            isDashboardPage
                ? ''
                : childTemplate
                  ? childTemplates.get(childTemplate._id)?.displayName
                  : entityTemplates.get(currTemplateId!)?.displayName
        } `;

        return { path, title };
    };

    const getInitialValues = () => {
        const baseValues = chart || dashboardInitialValues.chart;

        if (isDashboardPage && !chart)
            return {
                ...baseValues,
                filter: undefined,
                permission: IChartPermission.Protected,
                childTemplateId: childTemplate?._id,
            };

        return {
            ...baseValues,
            ...(chart ? {} : { templateId: currTemplateId }),
            childTemplateId: childTemplate?._id,
            filter: chart?.filter ? FilterModelToFilterRecord(parseFilters(chart?.filter), template?._id ?? '', queryClient) : undefined,
        };
    };

    const steps: TabStepComponent<ChartForm>[] = [
        {
            label: i18next.t('charts.generalDetails'),
            component: (props) => <ChartSideBar {...props} isDashboardPage={isDashboardPage} viewMode={viewMode} />,
            validationSchema: chartValidationSchema,
        },
        {
            label: i18next.t('charts.filterDetails'),
            component: (props) => <FilterSideBar {...props} viewMode={viewMode} />,
            validationSchema: Yup.object({
                filter: filtersSchema,
            }),
        },
    ];

    if (isLoadingGetChart) return <CircularProgress />;

    return (
        <DashboardItemDetails<ChartForm>
            title={i18next.t(`dashboard.charts.${viewMode === ViewMode.Add ? 'create' : 'edit'}Chart`)}
            backPath={getBackPath()}
            onDelete={deleteMutateAsync}
            steps={steps}
            initialValues={getInitialValues()}
            bodyComponent={(props) => <BodyComponent {...props} />}
            isLoading={isLoading}
            submitFunction={(values) => mutateAsync(values)}
            viewMode={{ value: viewMode, set: setViewMode }}
            type={DashboardItemType.Chart}
            chartPageProps={{ isChartPage: !isDashboardPage, usedInDashboard: chart?.usedInDashboard }}
        />
    );
};

export default Chart;

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
import { IPermission } from '../../../interfaces/charts';
import { ChartForm, DashboardItemType, ViewMode } from '../../../interfaces/dashboard';
import { IGraphFilterBodyBatch } from '../../../interfaces/entities';
import { IEntityTemplateMap } from '../../../interfaces/entityTemplates';
import { createChart, deleteChart, editChart, getChartById } from '../../../services/chartsService';
import { createDashboardItem, deleteDashboardItem } from '../../../services/dashboardService';
import { useUserStore } from '../../../stores/user';
import { chartValidationSchema } from '../../../utils/charts/getChartAxes';
import { dashboardInitialValues, filterDocumentToFilterBackend } from '../../../utils/dashboard/formik';
import { ChartSideBar } from '../../Charts/ChartPage/ChartSideBar';
import { FilterSideBar } from '../../Charts/ChartPage/filterSideBar';
import { FilterOfGraphToFilterRecord } from '../../Graph/GraphFilterToBackend';
import { DashboardItem } from '../DashboardItem';
import { BodyComponent } from './BodyComponent';

const { dashboardPath, chartPath } = environment.dashboard;

const Chart: React.FC = () => {
    const { templateId, chartId } = useParams<{ templateId?: string; chartId?: string }>();
    const [_, navigate] = useLocation();

    const currentUser = useUserStore((state) => state.user);
    const queryClient = useQueryClient();

    const [viewMode, setViewMode] = useState<ViewMode>(chartId ? ViewMode.ReadOnly : ViewMode.Add);
    const [filters, setFilters] = useState<number[]>([]);
    const [filterRecord, setFilterRecord] = useState<IGraphFilterBodyBatch>({});

    const { isDashboardPage = false, dashboardId = '' } = window.history.state ?? {};

    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;

    const { data: chart, isLoading: isLoadingGetChart } = useQuery(['getChart', chartId], () => getChartById(chartId!), {
        enabled: !!chartId,
    });

    const { isLoading, mutateAsync } = useMutation({
        mutationFn: async (chartData: ChartForm & { _id?: string }) => {
            const baseChart = {
                ...chartData,
                createdBy: currentUser._id,
                filter: filterDocumentToFilterBackend(chartData.templateId!, chartData.filter),
            };

            if (viewMode === ViewMode.Edit && chartId) {
                return editChart(chartId, baseChart);
            }

            // Add existing chart to dashboard
            if (chartData._id)
                return createDashboardItem({
                    type: DashboardItemType.Chart,
                    metaData: chartData._id,
                });

            return createChart(baseChart, isDashboardPage);
        },
        onSuccess: async (data, chartData) => {
            if (viewMode === ViewMode.Edit) {
                await queryClient.invalidateQueries(['getChart', chartId]);
                setViewMode(ViewMode.ReadOnly);

                updateFilters(data.filter);
            } else {
                const newChartId = chartData._id || data._id;
                const newTemplateId = chartData.templateId || data.templateId;

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

    const template = chart && entityTemplates.get(chart?.templateId!);

    useEffect(() => {
        if (chart && chartId) setViewMode(ViewMode.ReadOnly);
    }, [chartId, chart]);

    useEffect(() => {
        if (chart && template && chart.filter) updateFilters(chart.filter);
    }, [chart, template]);

    const updateFilters = (filter: string) => {
        const parsedFilter = JSON.parse(filter);
        const formattedFilter = FilterOfGraphToFilterRecord(parsedFilter, template!);

        setFilterRecord(formattedFilter);
        setFilters(Object.keys(formattedFilter).map(Number));
    };

    const getBackPath = () => {
        const path = isDashboardPage ? dashboardPath : `${chartPath}/${templateId}`;

        const title = isDashboardPage
            ? i18next.t('dashboard.mainScreen')
            : `${i18next.t('dashboard.charts.chartsPage')} ${entityTemplates.get(templateId as string)?.displayName || ''} `;

        return { path, title };
    };

    const getInitialValues = () => {
        const baseValues = chart || dashboardInitialValues.chart;

        if (isDashboardPage && !chart)
            return {
                ...baseValues,
                filter: undefined,
                permission: IPermission.Protected,
            };

        return {
            ...baseValues,
            ...(chart ? {} : { templateId }),
            filter: filterRecord,
        };
    };

    const steps: StepType<ChartForm>[] = [
        {
            label: i18next.t('charts.generalDetails'),
            component: (props) => <ChartSideBar {...props} isDashboardPage={isDashboardPage} viewMode={viewMode} />,
            validationSchema: chartValidationSchema,
        },
        {
            label: i18next.t('charts.filterDetails'),
            component: (props) => <FilterSideBar filters={{ value: filters, set: setFilters }} {...props} viewMode={viewMode} />,
            validationSchema: undefined,
        },
    ];

    if (isLoadingGetChart) return <CircularProgress />;

    return (
        <DashboardItem<ChartForm>
            title={i18next.t(`dashboard.charts.${viewMode === ViewMode.Add ? 'create' : 'edit'}Chart`)}
            backPath={getBackPath()}
            onDelete={deleteMutateAsync}
            steps={steps}
            initialValues={getInitialValues()}
            bodyComponent={(props) => <BodyComponent {...props} />}
            isLoading={isLoading}
            submitFunction={(values) => mutateAsync(values)}
            viewMode={{ value: viewMode, set: setViewMode }}
            onReset={(_values, _formikHelpers) => setFilters(Object.keys(filterRecord).map(Number))}
            type={DashboardItemType.Chart}
            chartPageProps={{ isChartPage: !isDashboardPage, usedInDashboard: chart?.usedInDashboard }}
        />
    );
};

export default Chart;

/* eslint-disable react/no-unstable-nested-components */
import { AxiosError } from 'axios';
import i18next from 'i18next';
import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { useLocation, useParams } from 'wouter';
import { CircularProgress } from '@mui/material';
import { ErrorToast } from '../../../common/ErrorToast';
import { StepType } from '../../../common/wizards';
import { IChart, IPermission } from '../../../interfaces/charts';
import { DashboardItemType, ViewMode } from '../../../interfaces/dashboard';
import { createChart, editChart, getChartById } from '../../../services/chartsService';
import { createDashboardItem, deleteDashboardItem } from '../../../services/dashboardService';
import { chartValidationSchema, initialValues } from '../../../utils/charts/getChartAxes';
import { ChartSideBar } from '../../Charts/ChartPage/ChartSideBar';
import { FilterSideBar } from '../../Charts/ChartPage/filterSideBar';
import { DashboardItem } from '../DashboardItem';
import { BodyComponent } from './BodyCompenent';
import { useUserStore } from '../../../stores/user';
import { IEntityTemplateMap } from '../../../interfaces/entityTemplates';
import { IGraphFilterBodyBatch } from '../../../interfaces/entities';
import { FilterOfGraphToFilterRecord } from '../../Graph/GraphFilterToBackend';
import { filterDocumentToFilterBackend } from '../../../utils/dashboard/formik';

const Chart: React.FC = () => {
    const { templateId, chartId } = useParams<{ templateId?: string; chartId?: string }>();
    const [_, navigate] = useLocation();
    const isDashboardPage: boolean = window.history.state?.isDashboardPage ?? false;

    const currentUser = useUserStore((state) => state.user);
    const queryClient = useQueryClient();
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;

    const { data: chart, isLoading: isLoadingGetChart } = useQuery(['getChart', chartId], () => getChartById(chartId!), {
        enabled: !!chartId,
    });

    const template = chart && entityTemplates.get(chart?.templateId!);

    const [viewMode, setViewMode] = useState<ViewMode>(chartId ? ViewMode.ReadOnly : ViewMode.Add);
    const [filters, setFilters] = useState<number[]>([]);
    const [filterRecord, setFilterRecord] = useState<IGraphFilterBodyBatch>({});

    const updateFilters = (filter: string) => {
        const parsedFilter = JSON.parse(filter as unknown as string);
        const formattedFilter = FilterOfGraphToFilterRecord(parsedFilter, template!);

        setFilterRecord(formattedFilter);
        setFilters(Object.keys(formattedFilter).map(Number));
    };

    useEffect(() => {
        if (chart && chartId) setViewMode(ViewMode.ReadOnly);
    }, [chartId, chart]);

    useEffect(() => {
        if (chart && template && chart.filter) updateFilters(chart.filter as unknown as string);
    }, [chart, template]);

    const { isLoading, mutateAsync } = useMutation({
        mutationFn: async (chartData: IChart) => {
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
    });

    const { mutateAsync: deleteMutateAsync } = useMutation(() => deleteDashboardItem(chartId!), {
        onSuccess: () => {
            navigate('/');
            toast.success(i18next.t('charts.actions.deletedSuccessfully'));
        },
        onError: (error: AxiosError) => {
            toast.error(<ErrorToast axiosError={error} defaultErrorMessage={i18next.t('charts.actions.failedToDelete')} />);
        },
    });

    const steps: StepType<IChart>[] = [
        {
            label: i18next.t('charts.generalDetails'),
            component: (props) => <ChartSideBar {...props} isDashboardPage={isDashboardPage} viewMode={viewMode} />,
            validationSchema: chartValidationSchema,
        },
        {
            label: i18next.t('charts.filterDetails'),
            component: (props) => <FilterSideBar filters={{ value: filters, set: setFilters }} {...props} />,
            validationSchema: undefined,
        },
    ];

    if (isLoadingGetChart) return <CircularProgress />;

    return (
        <DashboardItem<IChart>
            title={viewMode === ViewMode.Add ? 'הוספת תרשים' : 'עריכת תרשים'}
            backPath={{
                path: isDashboardPage ? '/' : `/charts/${templateId}`,
                title: isDashboardPage ? 'מסך ראשי' : `${entityTemplates.get(templateId as string)!.displayName} עמוד תרשימים `,
            }}
            onDelete={deleteMutateAsync}
            steps={steps}
            initialValues={{
                ...(chart || (isDashboardPage ? { ...initialValues, permission: IPermission.Protected } : { ...initialValues, templateId })),
                filter: filterRecord,
            }}
            bodyComponent={(props) => <BodyComponent {...props} />}
            isLoading={isLoading}
            submitFunction={(values) => mutateAsync(values)}
            viewMode={{ value: viewMode, set: setViewMode }}
            onReset={(_values, _formikHelpers) => setFilters(Object.keys(filterRecord).map(Number))}
        />
    );
};

export default Chart;

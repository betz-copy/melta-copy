/* eslint-disable react/no-unstable-nested-components */
import React, { useEffect } from 'react';
import i18next from 'i18next';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { useLocation, useParams } from 'wouter';
import { toast } from 'react-toastify';
import { AxiosError } from 'axios';
import { IChart } from '../../../interfaces/charts';
import { StepType } from '../../../common/wizards';
import { DashboardItem } from '../pages';
import { chartValidationSchema, initialValues } from '../../../utils/charts/getChartAxes';
import { FilterSideBar } from '../../Charts/ChartPage/filterSideBar';
import { ChartSideBar } from '../../Charts/ChartPage/ChartSideBar';
import { BodyComponent } from './BodyCompenent';
import { ChartMetaData, DashboardItemType, ViewMode } from '../../../interfaces/dashboard';
import { getChartById } from '../../../services/chartsService';
import { createDashboardItem, deleteDashboardItem, editDashboardItem } from '../../../services/dashboardService';
import { ErrorToast } from '../../../common/ErrorToast';

const Chart: React.FC = () => {
    const { templateId, chartId } = useParams<{ templateId?: string; chartId?: string }>();
    const [_, navigate] = useLocation();
    const queryClient = useQueryClient();

    const { data: chart, isLoadingGetChart } = useQuery(['getChart', chartId], () => getChartById(chartId!), {
        enabled: !!chartId,
    });

    const { isChartPage } = window.history.state;

    const [viewMode, setViewMode] = React.useState<ViewMode>(chartId ? ViewMode.Edit : ViewMode.Add);

    useEffect(() => {
        if (chartId && chart) setViewMode(ViewMode.ReadOnly);
    }, [chartId, chart]);

    const { isLoading, mutateAsync } = useMutation(
        (chartData: IChart) =>
            viewMode === ViewMode.Edit
                ? editDashboardItem(chartId!, { type: DashboardItemType.Chart, metaData: chartData as ChartMetaData })
                : createDashboardItem({ type: DashboardItemType.Chart, metaData: chartData } as ChartMetaData),

        {
            onSuccess: async (data) => {
                if (viewMode === ViewMode.Edit) {
                    queryClient.invalidateQueries(['getChart', chartId]);
                    setViewMode(ViewMode.ReadOnly);
                } else {
                    navigate(`/charts/${templateId}/${data._id}/chart`, { state: { isChartPage } });
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
            component: (props) => <ChartSideBar {...props} />,
            validationSchema: chartValidationSchema,
        },
        {
            label: i18next.t('charts.filterDetails'),
            component: (props) => <FilterSideBar {...props} />,
            validationSchema: undefined,
        },
    ];

    return (
        <DashboardItem<IChart>
            title="הוספת תרשים"
            backPath={{ path: isChartPage ? `/charts/${templateId}` : '/', title: isChartPage ? 'עמוד תרשימים ' : 'מסך ראשי' }}
            onDelete={deleteMutateAsync}
            steps={steps}
            initialValues={initialValues}
            bodyComponent={(props) => <BodyComponent {...props} />}
            isLoading={isLoading}
            submitFunction={(values) => mutateAsync(values)}
            viewMode={{ value: viewMode, set: setViewMode }}
        />
    );
};

export default Chart;

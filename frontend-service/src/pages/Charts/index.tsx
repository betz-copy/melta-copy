import { ChartsAndGenerator, DashboardItemType, IChildTemplateMap, IEntityTemplateMap } from '@microservices/shared';
import { CircularProgress, Grid } from '@mui/material';
import { AxiosError } from 'axios';
import i18next from 'i18next';
import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { useLocation, useParams } from 'wouter';
import { ErrorToast } from '../../common/ErrorToast';
import { LocalStorageGridLayout } from '../../common/GridLayout/gridLayoutSavedInLs';
import { LayoutItem } from '../../common/GridLayout/interface';
import { environment } from '../../globals';
import { deleteChart, getChartByTemplateId } from '../../services/chartsService';
import { useDarkModeStore } from '../../stores/darkMode';
import { generateLayoutDetails } from '../../utils/charts/defaultChartSizes';
import { LocalStorage } from '../../utils/localStorage';
import { isChildTemplate } from '../../utils/templates';
import { ConfirmDeleteDashboardItem, ConfirmEditCommonItem } from '../Dashboard/Dialogs';
import { DashboardHeader } from '../Dashboard/dashboardPage/DashboardHeader';
import { AddNewChartButton } from './AddNewChartButton';
import ChartItem from './chartsTemplatePage/chartItem';

const { chartsOrderKey } = environment.charts;

const ChartsPage: React.FC = () => {
    const { templateId } = useParams();
    const queryClient = useQueryClient();
    const [currentLocation, navigate] = useLocation();
    const darkMode = useDarkModeStore((state) => state.darkMode);
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const childTemplates = queryClient.getQueryData<IChildTemplateMap>('getChildTemplates')!;

    const childEntityTemplate = childTemplates.get(templateId as string);
    const fatherEntityTemplate = entityTemplates.get((childEntityTemplate ? childEntityTemplate.parentTemplate._id : templateId) as string)!;
    const template = childEntityTemplate || fatherEntityTemplate;
    const parentTemplateId = isChildTemplate(template) ? template.parentTemplate._id : template._id;

    const [textSearch, setTextSearch] = useState<string>();
    const [layout, setLayout] = useState<LayoutItem[]>([]);
    const [isHoverOnCard, setIsHoverOnCard] = useState<number | null>(null);
    const [deleteChartDialogState, setDeleteChartDialogState] = useState<{
        isDialogOpen: boolean;
        chartId: string | null;
        usedInDashboard?: boolean;
    }>({
        isDialogOpen: false,
        chartId: null,
    });
    const [editChartDialogState, setEditChartDialogState] = useState<{
        isDialogOpen: boolean;
        chartId: string | null;
    }>({
        isDialogOpen: false,
        chartId: null,
    });

    const { data, isFetching } = useQuery({
        queryKey: ['getCharts', templateId, textSearch, !!childEntityTemplate],
        queryFn: () => getChartByTemplateId(parentTemplateId, textSearch, childEntityTemplate?._id),
        initialData: [],
    });

    const charts = data ?? [];

    const { mutateAsync: deleteChartMutateAsync, isLoading: isDeleteChartLoading } = useMutation(
        ({ id, usedInDashboard }: { id: string; usedInDashboard?: boolean }) => deleteChart(id, usedInDashboard),
        {
            onSuccess: (data) => {
                toast.success(i18next.t('charts.actions.deletedSuccessfully'));
                setDeleteChartDialogState({ isDialogOpen: false, chartId: null });

                const updatedLayout = layout.filter((item) => item.i !== data._id);
                LocalStorage.set(`${chartsOrderKey}${templateId}`, updatedLayout);
                setLayout(updatedLayout);

                queryClient.invalidateQueries(['getCharts', templateId, textSearch]);
            },
            onError: (error: AxiosError) => {
                toast.error(<ErrorToast axiosError={error} defaultErrorMessage={i18next.t('charts.actions.failedToDelete')} />);
            },
        },
    );

    const onEditChartYes = (chartId: string) => navigate(`${currentLocation}/${chartId}/chart`, { state: { isDashboardPage: false } });

    return (
        <Grid>
            <DashboardHeader
                setTextSearch={setTextSearch}
                resetLayout={() => setLayout(generateLayoutDetails(charts).lg)}
                title={`${i18next.t('charts.chartsOf')} ${template.displayName}`}
                AddNewItem={AddNewChartButton}
            />
            {isFetching ? (
                <Grid container justifyContent="center" marginTop="2rem">
                    <CircularProgress />
                </Grid>
            ) : charts?.length === 0 ? (
                <Grid container justifyContent="center" marginTop="2rem">
                    {i18next.t('charts.noChartsFound')}
                </Grid>
            ) : (
                <LocalStorageGridLayout<ChartsAndGenerator>
                    items={charts}
                    localStorageKey={`${chartsOrderKey}${templateId}`}
                    generateDom={() =>
                        charts.map((chart, index) => (
                            <div
                                key={chart._id}
                                style={{
                                    background: darkMode ? '#131313' : 'white',
                                    border: '1px solid #CCCFE5',
                                    borderRadius: '7px',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    direction: 'rtl',
                                    padding: '20px 10px',
                                }}
                                onMouseEnter={() => setIsHoverOnCard(index)}
                                onMouseLeave={() => setIsHoverOnCard(null)}
                                data-grid={layout[index]}
                            >
                                <ChartItem
                                    chartDetails={chart}
                                    onDelete={() =>
                                        setDeleteChartDialogState({ chartId: chart._id, isDialogOpen: true, usedInDashboard: chart.usedInDashboard })
                                    }
                                    isHoverOnCard={isHoverOnCard}
                                    indexInGrid={index}
                                    onEdit={() =>
                                        chart.usedInDashboard
                                            ? setEditChartDialogState({ chartId: chart._id, isDialogOpen: true })
                                            : onEditChartYes(chart._id)
                                    }
                                />
                            </div>
                        ))
                    }
                    layout={{ value: layout, set: setLayout }}
                    textSearch={textSearch}
                />
            )}
            <ConfirmDeleteDashboardItem
                isDialogOpen={deleteChartDialogState.isDialogOpen}
                handleClose={() => setDeleteChartDialogState({ isDialogOpen: false, chartId: null })}
                onDeleteYes={() =>
                    deleteChartMutateAsync({ id: deleteChartDialogState.chartId!, usedInDashboard: deleteChartDialogState.usedInDashboard })
                }
                isLoading={isDeleteChartLoading}
                commonItemProps={{ isNotDashboardPage: true, usedInDashboard: deleteChartDialogState.usedInDashboard }}
                type={DashboardItemType.Chart}
            />

            <ConfirmEditCommonItem
                onEditYes={() => onEditChartYes(editChartDialogState.chartId!)}
                handleClose={() => setEditChartDialogState({ isDialogOpen: false, chartId: null })}
                isDialogOpen={editChartDialogState.isDialogOpen}
                type={DashboardItemType.Chart}
            />
        </Grid>
    );
};

export default ChartsPage;

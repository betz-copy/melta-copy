import { CircularProgress, Grid } from '@mui/material';
import i18next from 'i18next';
import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { useLocation, useParams } from 'wouter';
import { toast } from 'react-toastify';
import { AxiosError } from 'axios';
import { on } from 'events';
import { LocalStorageGridLayout } from '../../common/GridLayout/gridLayoutSavedInLs';
import { LayoutItem } from '../../common/GridLayout/interface';
import { environment } from '../../globals';
import { ChartsAndGenerator } from '../../interfaces/charts';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { deleteChart, getChartByTemplateId } from '../../services/chartsService';
import { generateLayoutDetails } from '../../utils/charts/defaultChartSizes';
import { DashboardHeader } from '../Dashboard/DashboardHeader';
import ChartItem from './templateTableCharts/chartItem';
import { AddNewChartButton } from './templateTableCharts/AddNewChartButton';
import { AreYouSureDialog } from '../../common/dialogs/AreYouSureDialog';
import { LocalStorage } from '../../utils/localStorage';
import { ErrorToast } from '../../common/ErrorToast';
import { ConfirmDeleteCommonItem, ConfirmEditCommonItem } from '../Dashboard/Dialogs';

const { chartsOrderKey } = environment.charts;

const ChartsPage: React.FC = () => {
    const { templateId } = useParams();
    const queryClient = useQueryClient();
    const [currentLocation, navigate] = useLocation();
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const template = entityTemplates.get(templateId as string) as IMongoEntityTemplatePopulated;

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

    const { data: charts, isLoading } = useQuery({
        queryKey: ['getCharts', templateId, textSearch],
        queryFn: () => getChartByTemplateId(templateId as string, textSearch),
        initialData: [],
    });

    const { mutateAsync: deleteChartMutateAsync, isLoading: isDeleteChartLoading } = useMutation((id: string) => deleteChart(id), {
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
    });

    const onEditChartYes = (chartId: string) => navigate(`${currentLocation}/${chartId}/chart`, { state: { isDashboardPage: false } });

    if (isLoading) return <CircularProgress />;

    return (
        <Grid>
            <DashboardHeader
                setTextSearch={setTextSearch}
                resetLayout={() => setLayout(generateLayoutDetails(charts ?? []).lg)}
                title={`${i18next.t('charts.chartsOf')} ${template.displayName}`}
                AddNewItem={AddNewChartButton}
            />
            <LocalStorageGridLayout<ChartsAndGenerator[]>
                items={charts ?? []}
                localStorageKey={`${chartsOrderKey}${templateId}`}
                generateDom={() =>
                    (charts ?? []).map((chart, index) => (
                        <div
                            key={chart._id}
                            style={{
                                background: 'white',
                                border: '1px solid #CCCFE5',
                                borderRadius: '7px',
                                position: 'relative',
                                overflow: 'hidden',
                                // cursor: 'pointer',
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
                layout={{
                    value: layout,
                    set: setLayout,
                }}
                textSearch={textSearch}
            />

            <ConfirmDeleteCommonItem
                isDialogOpen={deleteChartDialogState.isDialogOpen}
                handleClose={() => setDeleteChartDialogState({ isDialogOpen: false, chartId: null })}
                onDeleteYes={() => deleteChartMutateAsync(deleteChartDialogState.chartId!)}
                isLoading={isDeleteChartLoading}
                usedInDashboard={deleteChartDialogState.usedInDashboard}
            />
            <ConfirmEditCommonItem
                onEditYes={() => onEditChartYes(editChartDialogState.chartId!)}
                handleClose={() => setEditChartDialogState({ isDialogOpen: false, chartId: null })}
                isDialogOpen={editChartDialogState.isDialogOpen}
            />
        </Grid>
    );
};

export default ChartsPage;

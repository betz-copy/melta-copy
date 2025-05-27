import { CircularProgress, Grid } from '@mui/material';
import React, { useState } from 'react';
import { QueryClient, useMutation, useQuery, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import i18next from 'i18next';
import { AxiosError } from 'axios';
import { useLocation } from 'wouter';
import { LocalStorageGridLayout } from '../../common/GridLayout/gridLayoutSavedInLs';
import { LayoutItem } from '../../common/GridLayout/interface';
import { DashboardItemType, MongoDashboardItemPopulated } from '../../interfaces/dashboard';
import { deleteDashboardItem, getDashboardItems } from '../../services/dashboardService';
import { DashboardHeader } from './DashboardHeader';
import { DashboardItemViewPage } from './DashboardItemViewPage';
import { generateLayoutDetails } from '../../utils/charts/defaultChartSizes';
import { AddDashboardItem } from './AddDashboardItem';
import { LocalStorage } from '../../utils/localStorage';
import { ErrorToast } from '../../common/ErrorToast';
import { AreYouSureDialog } from '../../common/dialogs/AreYouSureDialog';
import { ConfirmEditCommonItem } from './Dialogs';

const Dashboard: React.FC = () => {
    const queryClient = useQueryClient();
    const [_, navigate] = useLocation();

    const [layout, setLayout] = useState<LayoutItem[]>([]);
    const [isHoverOnCard, setIsHoverOnCard] = useState<number | null>(null);
    const [textSearch, setTextSearch] = useState<string>();
    const [deleteChartDialogState, setDeleteChartDialogState] = useState<{
        isDialogOpen: boolean;
        chartId: string | null;
    }>({
        isDialogOpen: false,
        chartId: null,
    });

    const [editDashboardItemDialogState, setEditDashboardItemDialogState] = useState<{
        isDialogOpen: boolean;
        chartId: string | null;
        templateId: string | null;
        type: DashboardItemType | null;
    }>({
        isDialogOpen: false,
        chartId: null,
        templateId: null,
        type: null,
    });

    const { data: dashboardItems, isLoading } = useQuery({
        queryKey: ['getDashboard', textSearch],
        queryFn: () => getDashboardItems(textSearch),
        initialData: [],
    });

    const { mutateAsync: deleteDashboardItemMutateAsync, isLoading: isDeleteDashboardItemLoading } = useMutation(
        (id: string) => deleteDashboardItem(id),
        {
            onSuccess: (data) => {
                toast.success(i18next.t('charts.actions.deletedSuccessfully'));
                setDeleteChartDialogState({ isDialogOpen: false, chartId: null });

                const updatedLayout = layout.filter((item) => item.i !== data._id);
                LocalStorage.set('dashboard-layout', updatedLayout);
                setLayout(updatedLayout);

                queryClient.invalidateQueries(['getDashboard', textSearch]);
            },
            onError: (error: AxiosError) => {
                toast.error(<ErrorToast axiosError={error} defaultErrorMessage={i18next.t('charts.actions.failedToDelete')} />);
            },
        },
    );

    const onEditYes = () => {
        if (editDashboardItemDialogState.type === 'chart') {
            // `${currentLocation}/${_id}/chart`, { state: { isChartPage: true } })
            navigate(`/charts/${editDashboardItemDialogState.templateId}/${editDashboardItemDialogState.chartId}/chart`, {
                state: { isDashboardPage: true },
            });
        } else if (editDashboardItemDialogState.type === 'iframe') {
            navigate(`/iframe/${editDashboardItemDialogState.chartId}`);
        }
    };

    if (isLoading) return <CircularProgress />;

    return (
        <Grid>
            <DashboardHeader
                setTextSearch={setTextSearch}
                resetLayout={() => setLayout(generateLayoutDetails(dashboardItems ?? []).lg)}
                title="תצוגת מערכת"
                AddNewItem={AddDashboardItem}
            />
            <LocalStorageGridLayout<MongoDashboardItemPopulated[]>
                items={dashboardItems ?? []}
                localStorageKey="dashboard-layout"
                generateDom={() =>
                    (dashboardItems ?? []).map((chart, index) => (
                        <div
                            key={chart._id}
                            style={{
                                background: 'white',
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
                            <DashboardItemViewPage
                                chartDetails={chart}
                                indexInGrid={index}
                                isHoverOnCard={isHoverOnCard}
                                onDelete={() => setDeleteChartDialogState({ chartId: chart._id, isDialogOpen: true })}
                                onEdit={() => {
                                    console.log('Edit chart:', chart);

                                    // Navigate to edit page or open edit modal
                                    if (chart.type === 'chart') {
                                        setEditDashboardItemDialogState({
                                            chartId: chart.metaData._id,
                                            isDialogOpen: true,
                                            type: chart.type,
                                            templateId: chart.metaData.templateId,
                                        });
                                    } else if (chart.type === 'table') {
                                        navigate(`/table/${chart._id}`);
                                    } else {
                                        setEditDashboardItemDialogState({
                                            chartId: chart.metaData._id,
                                            isDialogOpen: true,
                                            type: chart.type,
                                            templateId: null,
                                        });
                                    }
                                }}
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
            <AreYouSureDialog
                open={deleteChartDialogState.isDialogOpen}
                handleClose={() => setDeleteChartDialogState({ isDialogOpen: false, chartId: null })}
                onYes={() => deleteDashboardItemMutateAsync(deleteChartDialogState.chartId!)}
                isLoading={isDeleteDashboardItemLoading}
            />
            {/* <AreYouSureDialog
                open={editDashboardItemDialogState.isDialogOpen}
                handleClose={() => setEditDashboardItemDialogState({ isDialogOpen: false, chartId: null })}
                onYes={onEditYes}
                isLoading={isDeleteDashboardItemLoading}
                yesTitle={i18next.t('dashboard.continueEdit')}
                noTitle={i18next.t('dashboard.back')}
                title={i18next.t('dashboard.charts.onEditDialog.title')}
                body={i18next.t('dashboard.charts.onEditDialog.body')}
            /> */}
            <ConfirmEditCommonItem
                isDialogOpen={editDashboardItemDialogState.isDialogOpen}
                handleClose={() => setEditDashboardItemDialogState({ isDialogOpen: false, chartId: null, templateId: null, type: null })}
                onEditYes={onEditYes}
            />
        </Grid>
    );
};

export default Dashboard;

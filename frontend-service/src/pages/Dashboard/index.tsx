import { CircularProgress, Grid } from '@mui/material';
import { AxiosError } from 'axios';
import i18next from 'i18next';
import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { useLocation } from 'wouter';
import { ErrorToast } from '../../common/ErrorToast';
import { LocalStorageGridLayout } from '../../common/GridLayout/gridLayoutSavedInLs';
import { LayoutItem } from '../../common/GridLayout/interface';
import { environment } from '../../globals';
import { DashboardItemType, MongoDashboardItemPopulated } from '../../interfaces/dashboard';
import { deleteDashboardItem, getDashboardItems } from '../../services/dashboardService';
import { useDarkModeStore } from '../../stores/darkMode';
import { generateLayoutDetails } from '../../utils/charts/defaultChartSizes';
import { LocalStorage } from '../../utils/localStorage';
import { AddDashboardItem } from './AddDashboardItem';
import { DashboardHeader } from './DashboardHeader';
import { DashboardItemViewPage } from './DashboardItemViewPage';
import { ConfirmDeleteDashboardItem, ConfirmEditCommonItem } from './Dialogs';
import NoItemsCard from './NoItemsCard';

const { dashboardOrderKey, chartPath, iFramePath, tablePath } = environment.dashboard;

const Dashboard: React.FC = () => {
    const queryClient = useQueryClient();
    const [_, navigate] = useLocation();
    const darkMode = useDarkModeStore((state) => state.darkMode);

    const [layout, setLayout] = useState<LayoutItem[]>([]);
    const [isHoverOnCard, setIsHoverOnCard] = useState<number | null>(null);
    const [textSearch, setTextSearch] = useState<string>();
    const [deleteChartDialogState, setDeleteChartDialogState] = useState<{
        isDialogOpen: boolean;
        chartId: string | null;
        type: DashboardItemType | null;
    }>({
        isDialogOpen: false,
        chartId: null,
        type: null,
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
    });

    const { mutateAsync: deleteDashboardItemMutateAsync, isLoading: isDeleteDashboardItemLoading } = useMutation(
        (id: string) => deleteDashboardItem(id),
        {
            onSuccess: (data) => {
                toast.success(i18next.t('charts.actions.deletedSuccessfully'));
                setDeleteChartDialogState({ isDialogOpen: false, chartId: null, type: null });

                const updatedLayout = layout.filter((item) => item.i !== data._id);
                LocalStorage.set(dashboardOrderKey, updatedLayout);
                setLayout(updatedLayout);

                queryClient.invalidateQueries(['getDashboard', textSearch]);
            },
            onError: (error: AxiosError) => {
                toast.error(<ErrorToast axiosError={error} defaultErrorMessage={i18next.t('charts.actions.failedToDelete')} />);
            },
        },
    );

    const onEditYes = () => {
        if (editDashboardItemDialogState.type === DashboardItemType.Chart) {
            navigate(`${chartPath}/${editDashboardItemDialogState.templateId}/${editDashboardItemDialogState.chartId}/chart`, {
                state: { isDashboardPage: true },
            });
        } else if (editDashboardItemDialogState.type === DashboardItemType.Iframe) {
            navigate(`${iFramePath}/${editDashboardItemDialogState.chartId}`);
        }
    };

    if (isLoading) return <CircularProgress />;

    return (
        <Grid>
            <DashboardHeader
                setTextSearch={setTextSearch}
                resetLayout={() => setLayout(generateLayoutDetails(dashboardItems ?? []).lg)}
                title={i18next.t('dashboard.systemView')}
                AddNewItem={AddDashboardItem}
            />
            {dashboardItems?.length === 0 ? (
                <Grid height="90vh" justifyContent="center" justifyItems="center" alignContent="center">
                    <NoItemsCard />
                </Grid>
            ) : (
                <LocalStorageGridLayout<MongoDashboardItemPopulated[]>
                    items={dashboardItems ?? []}
                    localStorageKey={dashboardOrderKey}
                    generateDom={() =>
                        (dashboardItems ?? []).map((dashboardItem, index) => (
                            <div
                                key={dashboardItem._id}
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
                                <DashboardItemViewPage
                                    chartDetails={dashboardItem}
                                    indexInGrid={index}
                                    isHoverOnCard={isHoverOnCard}
                                    onDelete={() =>
                                        setDeleteChartDialogState({ chartId: dashboardItem._id, isDialogOpen: true, type: dashboardItem.type })
                                    }
                                    onEdit={() => {
                                        if (dashboardItem.type === DashboardItemType.Chart) {
                                            setEditDashboardItemDialogState({
                                                chartId: dashboardItem.metaData._id,
                                                isDialogOpen: true,
                                                type: dashboardItem.type,
                                                templateId: dashboardItem.metaData.templateId!,
                                            });
                                        } else if (dashboardItem.type === DashboardItemType.Table) {
                                            navigate(`${tablePath}/${dashboardItem._id}`);
                                        } else {
                                            setEditDashboardItemDialogState({
                                                chartId: dashboardItem.metaData._id,
                                                isDialogOpen: true,
                                                type: dashboardItem.type,
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
            )}
            <ConfirmEditCommonItem
                isDialogOpen={editDashboardItemDialogState.isDialogOpen}
                handleClose={() => setEditDashboardItemDialogState({ isDialogOpen: false, chartId: null, templateId: null, type: null })}
                onEditYes={onEditYes}
                type={editDashboardItemDialogState.type}
            />
            <ConfirmDeleteDashboardItem
                isDialogOpen={deleteChartDialogState.isDialogOpen}
                handleClose={() => setDeleteChartDialogState({ isDialogOpen: false, chartId: null, type: null })}
                onDeleteYes={() => deleteDashboardItemMutateAsync(deleteChartDialogState.chartId!)}
                isLoading={isDeleteDashboardItemLoading}
                type={deleteChartDialogState.type}
            />
        </Grid>
    );
};

export default Dashboard;

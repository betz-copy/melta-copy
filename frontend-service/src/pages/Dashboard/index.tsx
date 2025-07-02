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
import { useWorkspaceStore } from '../../stores/workspace';
import { generateLayoutDetails } from '../../utils/charts/defaultChartSizes';
import { LocalStorage } from '../../utils/localStorage';
import { AddDashboardItem } from './AddDashboardItem';
import { DashboardHeader } from './dashboardPage/DashboardHeader';
import DashboardItemCard from './dashboardPage/DashboardItemCard';
import NoItemsCard from './dashboardPage/NoItemsCard';
import { ConfirmDeleteDashboardItem, ConfirmEditCommonItem } from './Dialogs';

const { dashboardOrderKey, chartPath, iFramePath, tablePath } = environment.dashboard;

const Dashboard: React.FC = () => {
    const queryClient = useQueryClient();
    const [_, navigate] = useLocation();
    const darkMode = useDarkModeStore((state) => state.darkMode);
    const workspace = useWorkspaceStore((state) => state.workspace);

    const [layout, setLayout] = useState<LayoutItem[]>([]);
    const [isHoverOnCard, setIsHoverOnCard] = useState<number | null>(null);
    const [textSearch, setTextSearch] = useState<string>();
    const [deleteItemDialogState, setDeleteItemDialogState] = useState<{
        isDialogOpen: boolean;
        itemId: string | null;
        type: DashboardItemType | null;
    }>({
        isDialogOpen: false,
        itemId: null,
        type: null,
    });

    const [editDashboardItemDialogState, setEditDashboardItemDialogState] = useState<{
        isDialogOpen: boolean;
        relatedId: string | null;
        dashboardId: string | null;
        templateId: string | null;
        type: DashboardItemType | null;
    }>({
        isDialogOpen: false,
        relatedId: null,
        dashboardId: null,
        templateId: null,
        type: null,
    });

    const { data: dashboardItems, isFetching } = useQuery({
        queryKey: ['getDashboard', textSearch, workspace._id],
        queryFn: () => getDashboardItems(textSearch),
        initialData: [],
    });

    const { mutateAsync: deleteDashboardItemMutateAsync, isLoading: isDeleteDashboardItemLoading } = useMutation(
        (id: string) => deleteDashboardItem(id),
        {
            onSuccess: (data) => {
                toast.success(i18next.t('charts.actions.deletedSuccessfully'));
                setDeleteItemDialogState({ isDialogOpen: false, itemId: null, type: null });

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

    const handleEdit = (dashboardItem: MongoDashboardItemPopulated) => {
        const { _id: dashboardId, type, metaData } = dashboardItem;

        if (type === DashboardItemType.Table) {
            navigate(`${tablePath}/${dashboardId}`);
            return;
        }

        const { _id: relatedId } = metaData;

        setEditDashboardItemDialogState({
            relatedId,
            isDialogOpen: true,
            type,
            templateId: type === DashboardItemType.Chart ? metaData.templateId! : null,
            dashboardId,
        });
    };

    const onEditYes = () => {
        const { type, relatedId, templateId, dashboardId } = editDashboardItemDialogState;

        switch (type) {
            case DashboardItemType.Chart:
                navigate(`${chartPath}/${templateId}/${relatedId}/chart`, {
                    state: { isDashboardPage: true, dashboardId },
                });
                break;

            case DashboardItemType.Iframe:
                navigate(`${iFramePath}/${relatedId}`, {
                    state: { dashboardId },
                });
                break;

            default:
                break;
        }
    };

    const renderNoDataMessage = () => {
        if (textSearch)
            return (
                <Grid container justifyContent="center" marginTop="2rem">
                    {i18next.t('noSearchResults')}
                </Grid>
            );

        return (
            <Grid height="90vh" justifyContent="center" justifyItems="center" alignContent="center">
                <NoItemsCard />
            </Grid>
        );
    };

    return (
        <Grid>
            <DashboardHeader
                setTextSearch={setTextSearch}
                resetLayout={() => setLayout(generateLayoutDetails(dashboardItems ?? []).lg)}
                title={i18next.t('dashboard.systemView')}
                AddNewItem={AddDashboardItem}
            />
            {isFetching ? (
                <Grid container justifyContent="center" marginTop="2rem">
                    <CircularProgress />
                </Grid>
            ) : dashboardItems?.length === 0 ? (
                renderNoDataMessage()
            ) : (
                <LocalStorageGridLayout<MongoDashboardItemPopulated>
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
                                <DashboardItemCard
                                    itemDetails={dashboardItem}
                                    indexInGrid={index}
                                    isHoverOnCard={isHoverOnCard}
                                    onDelete={() =>
                                        setDeleteItemDialogState({ itemId: dashboardItem._id, isDialogOpen: true, type: dashboardItem.type })
                                    }
                                    onEdit={() => handleEdit(dashboardItem)}
                                />
                            </div>
                        ))
                    }
                    layout={{ value: layout, set: setLayout }}
                    textSearch={textSearch}
                />
            )}

            <ConfirmEditCommonItem
                isDialogOpen={editDashboardItemDialogState.isDialogOpen}
                handleClose={() =>
                    setEditDashboardItemDialogState({ isDialogOpen: false, relatedId: null, templateId: null, type: null, dashboardId: null })
                }
                onEditYes={onEditYes}
                type={editDashboardItemDialogState.type}
            />

            <ConfirmDeleteDashboardItem
                isDialogOpen={deleteItemDialogState.isDialogOpen}
                handleClose={() => setDeleteItemDialogState({ isDialogOpen: false, itemId: null, type: null })}
                onDeleteYes={() => deleteDashboardItemMutateAsync(deleteItemDialogState.itemId!)}
                isLoading={isDeleteDashboardItemLoading}
                type={deleteItemDialogState.type}
            />
        </Grid>
    );
};

export default Dashboard;

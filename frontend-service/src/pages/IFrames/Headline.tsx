import { Delete, Edit, Favorite, FavoriteBorder, Hive as HiveIcon, OpenInFull } from '@mui/icons-material';
import { Dialog, Grid, IconButton, Typography, useTheme } from '@mui/material';
import { DashboardItemType } from '@packages/dashboard';
import { IMongoIframe } from '@packages/iframe';
import { AxiosError } from 'axios';
import i18next from 'i18next';
import React, { useState } from 'react';
import Iframe from 'react-iframe';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { CustomIcon } from '../../common/CustomIcon';
import { ErrorToast } from '../../common/ErrorToast';
import MeltaTooltip from '../../common/MeltaDesigns/MeltaTooltip';
import { IFrameWizard } from '../../common/wizards/iFrame';
import { deleteIFrame, iFrameObjectToIFrameForm, updateIFrame } from '../../services/iFramesService';
import { useDarkModeStore } from '../../stores/darkMode';
import { useUserStore } from '../../stores/user';
import { ConfirmDeleteDashboardItem, ConfirmEditCommonItem } from '../Dashboard/Dialogs';

const IFrameHeadline: React.FC<{
    iFrame: IMongoIframe;
    setIFramesOrder?: (value: string[]) => void;
    isIFramePage: boolean;
    setIFrameDeleted?: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({ iFrame, setIFramesOrder, isIFramePage, setIFrameDeleted }) => {
    const theme = useTheme();
    const darkMode = useDarkModeStore((state) => state.darkMode);
    const queryClient = useQueryClient();
    const currentUser = useUserStore((state) => state.user);

    const [isHovered, setIsHovered] = useState(false);
    const [placeInSideBar, setPlaceInSideBar] = useState<boolean>(iFrame.placeInSideBar ?? false);
    const [openFullSize, setOpenFullSize] = useState<boolean>(false);

    const [deleteIFrameDialogState, setDeleteIFrameDialogState] = useState<{
        isDialogOpen: boolean;
        iFrameId: string | null;
        usedInDashboard?: boolean;
    }>({
        isDialogOpen: false,
        iFrameId: null,
    });

    const [editIFrameDialogState, setEditIFrameDialogState] = useState<{
        isWizardOpen: boolean;
        iFrame: IMongoIframe | null;
    }>({
        isWizardOpen: false,
        iFrame: null,
    });

    const [iFrameWizardDialogState, setIFrameWizardDialogState] = useState<{
        isWizardOpen: boolean;
        iFrame: IMongoIframe | null;
    }>({
        isWizardOpen: false,
        iFrame: null,
    });
    const handleClose = () => {
        setOpenFullSize(false);
    };

    const closeEditDialog = () => setEditIFrameDialogState({ isWizardOpen: false, iFrame: null });

    const { isLoading, mutateAsync } = useMutation(
        ({ id, usedInDashboard }: { id: string; usedInDashboard?: boolean }) => deleteIFrame(id, usedInDashboard),
        {
            onSuccess: (data) => {
                queryClient.setQueryData<IMongoIframe[]>('allIFrames', (oldData) => {
                    if (!oldData) return [];
                    return oldData.filter((iframe) => iframe._id !== data._id);
                });
                setIFrameDeleted!((prev: boolean) => !prev);
                setDeleteIFrameDialogState({ isDialogOpen: false, iFrameId: null });
                toast.success(i18next.t('wizard.iFrame.deletedSuccessfully'));
            },
            onError: (err: AxiosError) => {
                toast.error(<ErrorToast axiosError={err} defaultErrorMessage={i18next.t('wizard.iFrame.failedToDelete')} />);
            },
        },
    );

    return (
        <Grid
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            sx={{ height: '3rem', margin: 0, padding: 0, backgroundColor: darkMode ? '#121212' : '#fff' }}
            container
            justifyContent="space-between"
            alignItems="center"
            wrap="nowrap"
            dir="rtl"
        >
            <Grid container direction="row" display="flex" wrap="nowrap" alignItems="center">
                <Grid container wrap="nowrap" alignItems="start" sx={{ display: 'flex', alignItems: 'center' }}>
                    <Grid sx={{ paddingLeft: '20px', display: 'flex' }}>
                        {iFrame.iconFileId ? (
                            <CustomIcon color={theme.palette.primary.main} iconUrl={iFrame.iconFileId} height="24px" width="24px" />
                        ) : (
                            <HiveIcon style={{ color: theme.palette.primary.main }} fontSize="medium" />
                        )}
                    </Grid>
                    <MeltaTooltip title={iFrame.url} placement="bottom-end">
                        <Grid sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography
                                style={{
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'normal',
                                    overflow: 'hidden',
                                    textAlign: 'right',
                                    padding: 15,
                                    fontWeight: 'bold',
                                    maxWidth: '240px',
                                    width: '200px',
                                }}
                                fontSize="20px"
                            >
                                {iFrame.name}
                            </Typography>
                        </Grid>
                    </MeltaTooltip>
                </Grid>
                {!isIFramePage && (
                    <Grid container wrap="nowrap" justifyContent="flex-end">
                        <Grid style={{ padding: '20px' }}>
                            {isHovered && (
                                <Grid sx={{ display: 'flex' }}>
                                    {currentUser.currentWorkspacePermissions.admin && (
                                        <>
                                            {/*  Todo: duplicate iframe */}
                                            <Grid>
                                                <MeltaTooltip title={i18next.t('actions.delete')}>
                                                    <IconButton
                                                        onClick={() =>
                                                            setDeleteIFrameDialogState({
                                                                isDialogOpen: true,
                                                                iFrameId: iFrame._id,
                                                                usedInDashboard: iFrame.usedInDashboard,
                                                            })
                                                        }
                                                    >
                                                        <Delete color="primary" fontSize="small" />
                                                    </IconButton>
                                                </MeltaTooltip>
                                            </Grid>
                                            <Grid>
                                                <MeltaTooltip title={i18next.t('actions.edit')}>
                                                    <IconButton
                                                        onClick={() =>
                                                            iFrame.usedInDashboard
                                                                ? setEditIFrameDialogState({ isWizardOpen: true, iFrame })
                                                                : setIFrameWizardDialogState({ isWizardOpen: true, iFrame })
                                                        }
                                                    >
                                                        <Edit color="primary" fontSize="small" />
                                                    </IconButton>
                                                </MeltaTooltip>
                                            </Grid>

                                            <Grid>
                                                <MeltaTooltip title={i18next.t('actions.favorites')}>
                                                    <IconButton
                                                        onClick={async () => {
                                                            setPlaceInSideBar(!placeInSideBar);
                                                            await updateIFrame(iFrame._id, {
                                                                ...iFrame,
                                                                placeInSideBar: !placeInSideBar,
                                                            });
                                                            queryClient.setQueryData<IMongoIframe[]>('allIFrames', (oldData) => {
                                                                if (!oldData) {
                                                                    return [];
                                                                }

                                                                const index = oldData.findIndex(
                                                                    (existingIframe) => existingIframe._id === iFrame._id,
                                                                );
                                                                const updatedData = [...oldData];
                                                                updatedData[index] = { ...iFrame, placeInSideBar: !placeInSideBar };
                                                                return [...updatedData];
                                                            });
                                                            queryClient.setQueryData(['getIFrame', iFrame._id], {
                                                                ...iFrame,
                                                                placeInSideBar: !placeInSideBar,
                                                            });
                                                        }}
                                                    >
                                                        {placeInSideBar ? (
                                                            <Favorite color="primary" fontSize="small" />
                                                        ) : (
                                                            <FavoriteBorder color="primary" fontSize="small" />
                                                        )}
                                                    </IconButton>
                                                </MeltaTooltip>
                                            </Grid>
                                        </>
                                    )}
                                    <Grid>
                                        <MeltaTooltip title={i18next.t('actions.expansion')}>
                                            <IconButton
                                                onClick={() => {
                                                    setOpenFullSize(true);
                                                }}
                                            >
                                                <OpenInFull color="primary" fontSize="small" />
                                            </IconButton>
                                        </MeltaTooltip>
                                    </Grid>
                                </Grid>
                            )}
                        </Grid>
                    </Grid>
                )}
            </Grid>

            <Dialog
                keepMounted={false}
                open={openFullSize}
                onClose={handleClose}
                maxWidth={false}
                slotProps={{
                    paper: {
                        style: {
                            height: '90vh',
                            width: '88vw',
                        },
                    },
                }}
            >
                <Iframe key={`${iFrame?.name}-${iFrame?.url}`} url={iFrame?.url} title={iFrame?.name} width="100%" height="100%" frameBorder={0} />
            </Dialog>
            <IFrameWizard
                open={iFrameWizardDialogState.isWizardOpen}
                handleClose={() => setIFrameWizardDialogState({ isWizardOpen: false, iFrame: null })}
                initialValues={iFrameObjectToIFrameForm(iFrameWizardDialogState.iFrame)}
                isEditMode={Boolean(iFrameWizardDialogState.iFrame)}
                setIFramesOrder={(val) => {
                    if (setIFramesOrder) setIFramesOrder(val);
                }}
            />

            <ConfirmEditCommonItem
                isDialogOpen={editIFrameDialogState.isWizardOpen}
                handleClose={closeEditDialog}
                onEditYes={() => {
                    closeEditDialog();
                    setIFrameWizardDialogState({ isWizardOpen: true, iFrame: editIFrameDialogState.iFrame });
                }}
                type={DashboardItemType.Iframe}
            />

            <ConfirmDeleteDashboardItem
                isDialogOpen={deleteIFrameDialogState.isDialogOpen}
                handleClose={() => setDeleteIFrameDialogState({ isDialogOpen: false, iFrameId: null })}
                onDeleteYes={() => mutateAsync({ id: deleteIFrameDialogState.iFrameId!, usedInDashboard: deleteIFrameDialogState.usedInDashboard })}
                isLoading={isLoading}
                type={DashboardItemType.Iframe}
                commonItemProps={{ isNotDashboardPage: true, usedInDashboard: deleteIFrameDialogState.usedInDashboard }}
            />
        </Grid>
    );
};

export default IFrameHeadline;

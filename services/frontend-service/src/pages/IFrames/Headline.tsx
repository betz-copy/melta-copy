import { Hive as HiveIcon } from '@mui/icons-material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import { Dialog, Grid, IconButton, Typography, useTheme } from '@mui/material';
import { AxiosError } from 'axios';
import i18next from 'i18next';
import React, { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import Iframe from 'react-iframe';
import { CustomIcon } from '../../common/CustomIcon';
import { ErrorToast } from '../../common/ErrorToast';
import { MeltaTooltip } from '../../common/MeltaTooltip';
import { AreYouSureDialog } from '../../common/dialogs/AreYouSureDialog';
import { IFrameWizard } from '../../common/wizards/iFrame';
import { IMongoIFrame } from '../../interfaces/iFrames';
import { deleteIFrame, iFrameObjectToIFrameForm, updateIFrame } from '../../services/iFramesService';
import { useUserStore } from '../../stores/user';
import { useDarkModeStore } from '../../stores/darkMode';

const IFrameHeadline: React.FC<{
    iFrame: IMongoIFrame;
    setIFramesOrder?: (value) => void;
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
    }>({
        isDialogOpen: false,
        iFrameId: null,
    });

    const [iFrameWizardDialogState, setIFrameWizardDialogState] = useState<{
        isWizardOpen: boolean;
        iFrame: IMongoIFrame | null;
    }>({
        isWizardOpen: false,
        iFrame: null,
    });
    const handleClose = () => {
        setOpenFullSize(false);
    };
    const { isLoading, mutateAsync } = useMutation((id: string) => deleteIFrame(id), {
        onSuccess: (data) => {
            queryClient.setQueryData<IMongoIFrame[]>('allIFrames', (oldData) => {
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
    });

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
                    <Grid item sx={{ paddingLeft: '20px', display: 'flex' }}>
                        {iFrame.iconFileId ? (
                            <CustomIcon color={theme.palette.primary.main} iconUrl={iFrame.iconFileId} height="24px" width="24px" />
                        ) : (
                            <HiveIcon style={{ color: theme.palette.primary.main }} fontSize="medium" />
                        )}
                    </Grid>
                    <MeltaTooltip title={iFrame.url} placement="bottom-end">
                        <Grid item sx={{ display: 'flex', alignItems: 'center' }}>
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
                        <Grid item style={{ padding: '20px' }}>
                            {isHovered && (
                                <Grid sx={{ display: 'flex' }}>
                                    {currentUser.currentWorkspacePermissions.admin && (
                                        <>
                                            {/*  Todo: duplicate iframe */}
                                            <Grid>
                                                <MeltaTooltip title={i18next.t('actions.delete')}>
                                                    <IconButton
                                                        onClick={() => setDeleteIFrameDialogState({ isDialogOpen: true, iFrameId: iFrame._id })}
                                                    >
                                                        <DeleteIcon color="primary" fontSize="small" />
                                                    </IconButton>
                                                </MeltaTooltip>
                                            </Grid>
                                            <Grid>
                                                <MeltaTooltip title={i18next.t('actions.edit')}>
                                                    <IconButton onClick={() => setIFrameWizardDialogState({ isWizardOpen: true, iFrame })}>
                                                        <EditIcon color="primary" fontSize="small" />
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
                                                            queryClient.setQueryData<IMongoIFrame[]>('allIFrames', (oldData) => {
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
                                                            <FavoriteIcon color="primary" fontSize="small" />
                                                        ) : (
                                                            <FavoriteBorderIcon color="primary" fontSize="small" />
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
                                                <OpenInFullIcon color="primary" fontSize="small" />
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
                PaperProps={{
                    style: {
                        height: '90vh',
                        width: '88vw',
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

            <AreYouSureDialog
                open={deleteIFrameDialogState.isDialogOpen}
                handleClose={() => setDeleteIFrameDialogState({ isDialogOpen: false, iFrameId: null })}
                onYes={() => mutateAsync(deleteIFrameDialogState.iFrameId!)}
                isLoading={isLoading}
            />
        </Grid>
    );
};

export default IFrameHeadline;

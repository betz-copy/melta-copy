import React, { useState } from 'react';
import { Dialog, Grid, IconButton, Typography, useTheme } from '@mui/material';
import i18next from 'i18next';
import { useMutation, useQueryClient } from 'react-query';
import DeleteIcon from '@mui/icons-material/Delete';
import { AxiosError } from 'axios';
import { toast } from 'react-toastify';
import EditIcon from '@mui/icons-material/Edit';
import { useNavigate } from 'react-router-dom';
import { Hive as HiveIcon } from '@mui/icons-material';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import Iframe from 'react-iframe';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { TopBarGrid } from '../../common/TopBar';
import { IPermissionsOfUser } from '../../services/permissionsService';
import { IMongoIFrame } from '../../interfaces/iFrames';
import { ErrorToast } from '../../common/ErrorToast';
import { AreYouSureDialog } from '../../common/dialogs/AreYouSureDialog';
import { deleteIFrame, iFrameObjectToIFrameForm, updateIFrame } from '../../services/iFramesService';
import { MeltaTooltip } from '../../common/MeltaTooltip';
import { CustomIcon } from '../../common/CustomIcon';
import { IFrameWizard } from '../../common/wizards/iFrame';

const IFrameHeadline: React.FC<{ iFrame: IMongoIFrame; setIFramesOrder?: (value) => void }> = ({ iFrame, setIFramesOrder }) => {
    const theme = useTheme();
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const myPermissions = queryClient.getQueryData<IPermissionsOfUser>('getMyPermissions')!;

    const [isHovered, setIsHovered] = useState(false);
    const [placeInSideBar, setPlaceInSideBar] = useState<boolean>(iFrame.placeInSideBar ?? false);
    const [open, setOpen] = useState<{
        isOpen: boolean;
    }>({ isOpen: false });

    const handleClose = () => {
        setOpen({ isOpen: false });
    };

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
    const { isLoading, mutateAsync } = useMutation((id: string) => deleteIFrame(id), {
        onSuccess: (data) => {
            queryClient.invalidateQueries('searchIFrames');
            queryClient.setQueryData<IMongoIFrame[]>('allIFrames', (oldData) => {
                if (!oldData) return [];
                return oldData.filter((iframe) => iframe._id !== data._id);
            });
            setDeleteIFrameDialogState({ isDialogOpen: false, iFrameId: null });
            navigate('/iframes');
            toast.success(i18next.t('wizard.iFrame.deletedSuccessfully'));
        },
        onError: (err: AxiosError) => {
            toast.error(<ErrorToast axiosError={err} defaultErrorMessage={i18next.t('wizard.iFrame.failedToDelete')} />);
        },
    });
    return (
        <TopBarGrid
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            sx={{ height: '3rem', margin: 0, padding: 0 }}
            container
            justifyContent="space-between"
            alignItems="center"
            wrap="nowrap"
            dir="rtl"
        >
            <Grid container direction="row" display="flex" wrap="nowrap" alignItems="center">
                <Grid container wrap="nowrap" alignItems="start">
                    <Grid container item sx={{ display: 'flex', alignItems: 'center' }}>
                        <Grid item sx={{ paddingLeft: '20px', display: 'flex' }}>
                            {iFrame.iconFileId ? (
                                <CustomIcon color={theme.palette.primary.main} iconUrl={iFrame.iconFileId} height="24px" width="24px" />
                            ) : (
                                <HiveIcon style={{ color: theme.palette.primary.main }} fontSize="medium" />
                            )}
                        </Grid>
                        <Grid item sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography
                                style={{
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textAlign: 'right',
                                    padding: 20,
                                    fontWeight: 'bold',
                                }}
                                fontSize="20px"
                            >
                                {iFrame.name}
                            </Typography>
                        </Grid>
                    </Grid>
                </Grid>
                <Grid container wrap="nowrap" justifyContent="flex-end">
                    <Grid item style={{ padding: '20px' }}>
                        {isHovered && (
                            <Grid sx={{ display: 'flex' }}>
                                {/* {myPermissions.templatesManagementId && ( */}
                                <>
                                    <Grid>
                                        <MeltaTooltip title={i18next.t('actions.delete')}>
                                            <IconButton onClick={() => setDeleteIFrameDialogState({ isDialogOpen: true, iFrameId: iFrame._id })}>
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
                                </>
                                {/* )}/ */}
                                <Grid>
                                    <MeltaTooltip title={i18next.t('actions.favourites')}>
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

                                                    const index = oldData.findIndex((existingIframe) => existingIframe._id === iFrame._id);
                                                    const updatedData = [...oldData];
                                                    updatedData[index] = { ...iFrame, placeInSideBar: !placeInSideBar };
                                                    return [...updatedData];
                                                });
                                                queryClient.setQueryData(['getIFrame', iFrame._id], { ...iFrame, placeInSideBar: !placeInSideBar });
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
                                <Grid>
                                    <MeltaTooltip title={i18next.t('actions.expansion')}>
                                        <IconButton onClick={() => setOpen({ isOpen: true })}>
                                            <OpenInFullIcon color="primary" fontSize="small" />
                                        </IconButton>
                                    </MeltaTooltip>
                                </Grid>
                            </Grid>
                        )}
                    </Grid>
                </Grid>
            </Grid>

            <Dialog
                keepMounted={false}
                open={open.isOpen}
                onClose={handleClose}
                maxWidth={false}
                PaperProps={{
                    style: {
                        height: '90vh',
                        width: '88vw',
                    },
                }}
            >
                <Iframe url={iFrame!.url} title={iFrame!.name} width="100%" height="100%" frameBorder={0} />
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
        </TopBarGrid>
    );
};

export default IFrameHeadline;

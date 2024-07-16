import React, { useState } from 'react';
import { Grid, IconButton, Typography, useTheme } from '@mui/material';
import i18next from 'i18next';
import { useMutation, useQueryClient } from 'react-query';
import DeleteIcon from '@mui/icons-material/Delete';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import { AxiosError } from 'axios';
import { toast } from 'react-toastify';
import EditIcon from '@mui/icons-material/Edit';
import { useNavigate } from 'react-router-dom';
import { Hive as HiveIcon } from '@mui/icons-material';
import { TopBarGrid } from '../../common/TopBar';
import { IPermissionsOfUser } from '../../services/permissionsService';
import { IFrameMap, IMongoIFrame } from '../../interfaces/iFrames';
import { CardMenu } from '../SystemManagement/components/CardMenu';
import { ErrorToast } from '../../common/ErrorToast';
import { AreYouSureDialog } from '../../common/dialogs/AreYouSureDialog';
import { deleteIFrame, iFrameObjectToIFrameForm } from '../../services/iFramesService';
import { MeltaTooltip } from '../../common/MeltaTooltip';
import { CustomIcon } from '../../common/CustomIcon';
import { IFrameWizard } from '../../common/wizards/iFrame';

const IFramesHeadline: React.FC<{ iFrame: IMongoIFrame; isIFramePage?: boolean }> = ({ iFrame, isIFramePage = true }) => {
    const theme = useTheme();
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const myPermissions = queryClient.getQueryData<IPermissionsOfUser>('getMyPermissions')!;
    // const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    // const handleCloseMenu = (e: React.MouseEvent<HTMLLIElement, MouseEvent>) => {
    //     e.stopPropagation();
    //     setAnchorEl(null);
    // };
    // const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    //     event.stopPropagation();
    //     setAnchorEl(event.currentTarget);
    // };
    const [isHovered, setIsHovered] = useState(false);

    const iFrames = queryClient.getQueryData<IFrameMap>('getIFrames')!;
    console.log({ iFrames });

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
        onSuccess: (_data, id) => {
            setDeleteIFrameDialogState({ isDialogOpen: false, iFrameId: null });
            navigate('/iFrames');
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
                                    // width: '20%',
                                }}
                                fontSize="20px"
                                // overflow="hidden"
                                // textOverflow="ellipsis"
                            >
                                {iFrame.name}
                            </Typography>
                        </Grid>
                    </Grid>
                </Grid>
                <Grid container wrap="nowrap" justifyContent="flex-end">
                    <Grid item style={{ padding: '20px' }}>
                        {isHovered && !isIFramePage ? (
                            <Grid container wrap="nowrap" gap="15px">
                                <Grid item>
                                    <CardMenu
                                        onEditClick={() => setIFrameWizardDialogState({ isWizardOpen: true, iFrame })}
                                        onDeleteClick={() => setDeleteIFrameDialogState({ isDialogOpen: true, iFrameId: iFrame._id })}
                                    />
                                </Grid>

                                <Grid>
                                    <OpenInFullIcon style={{ color: 'grey' }} />
                                </Grid>
                            </Grid>
                        ) : (
                            <Grid sx={{ display: 'flex' }}>
                                <Grid>
                                    <MeltaTooltip title={i18next.t('actions.delete')}>
                                        <IconButton onClick={() => setDeleteIFrameDialogState({ isDialogOpen: true, iFrameId: iFrame._id })}>
                                            <DeleteIcon color="primary" />
                                        </IconButton>
                                    </MeltaTooltip>
                                </Grid>
                                <Grid>
                                    <MeltaTooltip title={i18next.t('actions.edit')}>
                                        <IconButton onClick={() => setIFrameWizardDialogState({ isWizardOpen: true, iFrame })}>
                                            <EditIcon color="primary" />
                                        </IconButton>
                                    </MeltaTooltip>
                                </Grid>
                            </Grid>
                        )}
                    </Grid>
                </Grid>
            </Grid>

            <IFrameWizard
                open={iFrameWizardDialogState.isWizardOpen}
                handleClose={() => setIFrameWizardDialogState({ isWizardOpen: false, iFrame: null })}
                initialValues={iFrameObjectToIFrameForm(iFrameWizardDialogState.iFrame)}
                isEditMode={Boolean(iFrameWizardDialogState.iFrame)}
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

export default IFramesHeadline;

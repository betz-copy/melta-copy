import React, { Dispatch, SetStateAction, useState } from 'react';
import { Grid, IconButton, Menu, Typography, useTheme } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import i18next from 'i18next';
import { useMutation, useQueryClient } from 'react-query';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import MoreVertSharpIcon from '@mui/icons-material/MoreVertSharp';
import DeleteIcon from '@mui/icons-material/Delete';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import { AxiosError } from 'axios';
import { toast } from 'react-toastify';
import { TopBarGrid } from '../../common/TopBar';
import { BlueTitle } from '../../common/BlueTitle';
import { GlobalSearchBar } from '../../common/EntitiesPage/Headline';
// import ProcessTemplatesSelectCheckbox from './ProcessTemplatesCheckbox';
// import { AddProcessButton } from './AddProcessButton';
import { IMongoProcessTemplatePopulated } from '../../interfaces/processes/processTemplate';
import { IPermissionsOfUser } from '../../services/permissionsService';
// import './ProcessesList.css';
import DateRange from '../../common/inputs/DateRange';
import { environment } from '../../globals';
import ProcessTemplatesSelectCheckbox from '../ProcessInstances/ProcessTemplatesCheckbox';
import { AddProcessButton } from '../ProcessInstances/AddProcessButton';
import { IFrame, IFrameMap, IMongoIFrame } from '../../interfaces/iFrames';
import { MenuButton } from '../../common/MenuButton';
import { CardMenu } from '../SystemManagement/components/CardMenu';
import { ErrorToast } from '../../common/ErrorToast';
import { AreYouSureDialog } from '../../common/dialogs/AreYouSureDialog';
import { deleteIFrame } from '../../services/iFramesService';

const IFramesHeadline: React.FC<{ iFrame: IMongoIFrame }> = ({ iFrame }) => {
    const theme = useTheme();
    const queryClient = useQueryClient();

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

    // const iFrames = queryClient.getQueryData<IFrameMap>('getIFrames')!;

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
            // queryClient.setQueryData<IFrameMap>('getIFrames', (data) => {
            //     data!.delete(id);
            //     return data!;
            // });

            setDeleteIFrameDialogState({ isDialogOpen: false, iFrameId: null });
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
                    <Grid item>
                        <Grid>{iFrame.icon}</Grid>
                        <Typography
                            style={{
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textAlign: 'right',
                                padding: 20,
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
                <Grid container wrap="nowrap" justifyContent="flex-end">
                    <Grid item>
                        {isHovered && (
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
                        )}
                    </Grid>
                </Grid>
            </Grid>
            {/* <CategoryWizard
                open={categoryWizardDialogState.isWizardOpen}
                handleClose={() => setCategoryWizardDialogState({ isWizardOpen: false, category: null })}
                initialValues={categoryObjectToCategoryForm(categoryWizardDialogState.category)}
                isEditMode={Boolean(categoryWizardDialogState.category)}
            /> */}
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

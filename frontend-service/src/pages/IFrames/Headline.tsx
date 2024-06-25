import React, { Dispatch, SetStateAction, useState } from 'react';
import { Grid, IconButton, Menu, Typography, useTheme } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import i18next from 'i18next';
import { useQueryClient } from 'react-query';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import MoreVertSharpIcon from '@mui/icons-material/MoreVertSharp';
import DeleteIcon from '@mui/icons-material/Delete';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
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
import { IFrame, IMongoIFrame } from '../../interfaces/iFrames';
import { MenuButton } from '../../common/MenuButton';
import { CardMenu } from '../SystemManagement/components/CardMenu';

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

    return (
        <TopBarGrid
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            sx={{ height: '3.6rem' }}
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
                            }}
                            fontSize="20px"
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
        </TopBarGrid>
    );
};

export default IFramesHeadline;

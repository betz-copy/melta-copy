import React from 'react';
import { Grid, IconButton, Typography, useTheme } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import i18next from 'i18next';
import { useQueryClient } from 'react-query';
import { TopBarGrid } from '../../common/TopBar';
import { IPermissionsOfUser } from '../../services/permissionsService';
import { BlueTitle } from '../../common/BlueTitle';
import { environment } from '../../globals';

const IFramesHeadline: React.FC<{
    onSearch: (value: string) => void;
    setIFrameWizardDialogState?: () => void;
}> = ({ onSearch, setIFrameWizardDialogState }) => {
    const theme = useTheme();

    const queryClient = useQueryClient();
    const myPermissions = queryClient.getQueryData<IPermissionsOfUser>('getMyPermissions')!;

    return (
        <TopBarGrid sx={{ height: '3.6rem' }} dir="rtl" container justifyContent="space-between" alignItems="center" wrap="nowrap">
            <Grid item>
                <Grid container spacing={5} wrap="nowrap" alignItems="center">
                    <Grid item>
                        <BlueTitle
                            title={i18next.t('pages.iFrames')}
                            component="h4"
                            variant="h4"
                            style={{ fontSize: environment.mainFontSizes.headlineTitleFontSize }}
                        />
                    </Grid>
                </Grid>
            </Grid>
            <Grid item>
                {/* {myPermissions.templatesManagementId && ( */}
                <IconButton onClick={setIFrameWizardDialogState} style={{ backgroundColor: 'pink' }}>
                    <AddIcon htmlColor="primary" />
                    <Typography fontSize={14} style={{ fontWeight: '500' }}>
                        {i18next.t('wizard.iFrame.addIFrame')}
                    </Typography>
                </IconButton>
                {/* )} */}
                {/* {myPermissions.processesManagementId && (
                    <AddProcessButton style={{ background: theme.palette.primary.main, borderRadius: '5px' }}></AddProcessButton>
                )} */}
            </Grid>
        </TopBarGrid>
    );
};

export default IFramesHeadline;

import { Add as AddIcon } from '@mui/icons-material';
import { Grid, Typography, useTheme } from '@mui/material';
import i18next from 'i18next';
import React, { Dispatch, SetStateAction } from 'react';
import BlueTitle from '../../common/MeltaDesigns/BlueTitle';
import { TopBarGrid } from '../../common/TopBar';
import { PermissionScope } from '../../interfaces/permissions';
import { IMongoProcessTemplatePopulated } from '../../interfaces/processes/processTemplate';
import { useUserStore } from '../../stores/user';
import { useWorkspaceStore } from '../../stores/workspace';
import { AddProcessButton } from './AddProcessButton';
import './ProcessesList.css';

const ProcessInstancesHeadline: React.FC<{
    onSearch: (value: string) => void;
    onSetStartDate: (newStartDateInput: Date | null) => void;
    onSetEndDate: (newEndDateInput: Date | null) => void;
    templatesSelectCheckboxProps: {
        templates: IMongoProcessTemplatePopulated[];
        templatesToShow: IMongoProcessTemplatePopulated[];
        setTemplatesToShow: Dispatch<SetStateAction<IMongoProcessTemplatePopulated[]>>;
    };
    startDateInput: Date | null;
    endDateInput: Date | null;
    searchInput: string;
}> = () => {
    const workspace = useWorkspaceStore((state) => state.workspace);

    const theme = useTheme();

    const currentUser = useUserStore((state) => state.user);

    return (
        <TopBarGrid sx={{ height: '3.6rem' }} container justifyContent="space-between" alignItems="center" wrap="nowrap">
            <Grid>
                <Grid container spacing={5} wrap="nowrap" alignItems="center">
                    <Grid>
                        <BlueTitle
                            title={i18next.t('pages.processInstances')}
                            component="h4"
                            variant="h4"
                            style={{ fontSize: workspace.metadata.mainFontSizes.headlineTitleFontSize }}
                        />
                    </Grid>
                </Grid>
            </Grid>

            <Grid>
                {(currentUser.currentWorkspacePermissions.processes?.scope === PermissionScope.write ||
                    currentUser.currentWorkspacePermissions.admin?.scope === PermissionScope.write) && (
                    <AddProcessButton style={{ background: theme.palette.primary.main, borderRadius: '5px', height: '35px' }}>
                        <AddIcon htmlColor="white" />
                        <Typography fontSize={14} style={{ fontWeight: '500', padding: '0 10px', color: 'white' }}>
                            {i18next.t('processInstancesPage.addProcess')}
                        </Typography>
                    </AddProcessButton>
                )}
            </Grid>
        </TopBarGrid>
    );
};

export default ProcessInstancesHeadline;

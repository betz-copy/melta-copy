import React, { Dispatch, SetStateAction } from 'react';
import { Grid, Typography, useTheme } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import i18next from 'i18next';
import { IMongoProcessTemplateReviewerPopulated, PermissionScope } from '@microservices/shared-interfaces';
import { TopBarGrid } from '../../common/TopBar';
import { BlueTitle } from '../../common/BlueTitle';
import { AddProcessButton } from './AddProcessButton';
import './ProcessesList.css';
import { useUserStore } from '../../stores/user';
import { useWorkspaceStore } from '../../stores/workspace';

const ProcessInstancesHeadline: React.FC<{
    onSearch: (value: string) => void;
    onSetStartDate: (newStartDateInput: Date | null) => void;
    onSetEndDate: (newEndDateInput: Date | null) => void;
    templatesSelectCheckboxProps: {
        templates: IMongoProcessTemplateReviewerPopulated[];
        templatesToShow: IMongoProcessTemplateReviewerPopulated[];
        setTemplatesToShow: Dispatch<SetStateAction<IMongoProcessTemplateReviewerPopulated[]>>;
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
            <Grid item>
                <Grid container spacing={5} wrap="nowrap" alignItems="center">
                    <Grid item>
                        <BlueTitle
                            title={i18next.t('pages.processInstances')}
                            component="h4"
                            variant="h4"
                            style={{ fontSize: workspace.metadata.mainFontSizes.headlineTitleFontSize }}
                        />
                    </Grid>
                </Grid>
            </Grid>

            <Grid item>
                {(currentUser.currentWorkspacePermissions.processes?.scope === PermissionScope.write ||
                    currentUser.currentWorkspacePermissions.admin?.scope === PermissionScope.write) && (
                    <AddProcessButton style={{ background: theme.palette.primary.main, borderRadius: '5px', height: '35px' }}>
                        <AddIcon htmlColor="white" />
                        <Typography fontSize={14} style={{ fontWeight: '500', padding: '0 10px', color: 'white' }}>
                            {String(i18next.t('processInstancesPage.addProcess'))}
                        </Typography>
                    </AddProcessButton>
                )}
            </Grid>
        </TopBarGrid>
    );
};

export default ProcessInstancesHeadline;

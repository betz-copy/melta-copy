import React, { Dispatch, SetStateAction } from 'react';
import { Grid, IconButton, Typography, useTheme } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import i18next from 'i18next';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import { IMongoProcessTemplateReviewerPopulated, PermissionScope } from '@microservices/shared';
import { TopBarGrid } from '../../common/TopBar';
import { BlueTitle } from '../../common/BlueTitle';
import { GlobalSearchBar } from '../../common/EntitiesPage/Headline';
import ProcessTemplatesSelectCheckbox from './ProcessTemplatesCheckbox';
import { AddProcessButton } from './AddProcessButton';
import './ProcessesList.css';
import DateRange from '../../common/inputs/DateRange';
import { environment } from '../../globals';
import { useUserStore } from '../../stores/user';

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
}> = ({ onSearch, onSetStartDate, onSetEndDate, templatesSelectCheckboxProps, startDateInput, endDateInput, searchInput }) => {
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
                            style={{ fontSize: environment.mainFontSizes.headlineTitleFontSize }}
                        />
                    </Grid>
                    <Grid item>
                        <Grid container wrap="nowrap" gap="15px">
                            <Grid item>
                                <ProcessTemplatesSelectCheckbox
                                    templates={templatesSelectCheckboxProps.templates}
                                    selectedTemplates={templatesSelectCheckboxProps.templatesToShow}
                                    setSelectedTemplates={templatesSelectCheckboxProps.setTemplatesToShow}
                                />
                            </Grid>
                            <Grid item>
                                <GlobalSearchBar
                                    inputValue={searchInput}
                                    setInputValue={onSearch}
                                    onSearch={onSearch}
                                    borderRadius="7px"
                                    placeholder={i18next.t('globalSearch.searchInPage')}
                                    toTopBar
                                />
                            </Grid>
                        </Grid>
                    </Grid>
                    <Grid item>
                        <DateRange
                            onStartDateChange={onSetStartDate}
                            onEndDateChange={onSetEndDate}
                            startDateInput={startDateInput}
                            endDateInput={endDateInput}
                            directionIsRow
                        />
                    </Grid>
                    <Grid item>
                        <IconButton
                            onClick={() => {
                                onSetStartDate(null);
                                onSetEndDate(null);
                                onSearch('');
                            }}
                            sx={{ borderRadius: 10, height: '35px', width: '35px' }}
                        >
                            <FilterAltOffIcon />
                        </IconButton>
                    </Grid>
                </Grid>
            </Grid>

            <Grid item>
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

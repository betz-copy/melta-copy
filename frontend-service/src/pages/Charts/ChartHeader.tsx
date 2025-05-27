import { Add as AddIcon } from '@mui/icons-material';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import { Grid, IconButton, Typography, useTheme } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import { useLocation } from 'wouter';
import { BlueTitle } from '../../common/BlueTitle';
import IconButtonWithPopover from '../../common/IconButtonWithPopover';
import SearchInput from '../../common/inputs/SearchInput';
import { MeltaTooltip } from '../../common/MeltaTooltip';
import { TopBarGrid } from '../../common/TopBar';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { useWorkspaceStore } from '../../stores/workspace';

const ChartHeader: React.FC<{
    template: IMongoEntityTemplatePopulated;
    setTextSearch: React.Dispatch<React.SetStateAction<string | undefined>>;
    resetLayout: () => void;
}> = ({ template, setTextSearch, resetLayout }) => {
    const workspace = useWorkspaceStore((state) => state.workspace);
    const theme = useTheme();

    const [currentLocation, navigate] = useLocation();

    return (
        <TopBarGrid sx={{ height: '3.6rem' }} container justifyContent="space-between" alignItems="center" wrap="nowrap">
            <Grid item>
                <Grid container spacing={5} wrap="nowrap" alignItems="center">
                    <Grid item>
                        <BlueTitle
                            title={`${i18next.t('charts.chartsOf')} ${template.displayName}`}
                            component="h4"
                            variant="h4"
                            style={{ fontSize: workspace.metadata.mainFontSizes.headlineTitleFontSize }}
                        />
                    </Grid>
                    <Grid item>
                        <Grid container wrap="nowrap" gap="15px">
                            <SearchInput
                                onChange={(searchValue) => setTextSearch(searchValue || undefined)}
                                placeholder={i18next.t('globalSearch.searchInPage')}
                                toTopBar
                            />
                        </Grid>
                    </Grid>
                    <Grid item>
                        <MeltaTooltip title={i18next.t('iFrames.filterDrags')}>
                            <IconButton onClick={resetLayout} sx={{ borderRadius: 10, height: '35px', width: '35px' }}>
                                <FilterAltOffIcon sx={{ fontSize: '26px' }} />
                            </IconButton>
                        </MeltaTooltip>
                    </Grid>
                </Grid>
            </Grid>

            <Grid item>
                <IconButtonWithPopover
                    popoverText={i18next.t('charts.actions.addChart')}
                    iconButtonProps={{
                        onClick: () => navigate(`${currentLocation}/chart`, { state: { isDashboardPage: false } }),
                    }}
                    style={{ background: theme.palette.primary.main, borderRadius: '7px', width: '150px', height: '35px' }}
                >
                    <AddIcon htmlColor="white" />
                    <Typography fontSize={13} style={{ fontWeight: '400', padding: '0 5px', color: 'white' }}>
                        {i18next.t('charts.actions.addChart')}
                    </Typography>
                </IconButtonWithPopover>
            </Grid>
        </TopBarGrid>
    );
};

export { ChartHeader };

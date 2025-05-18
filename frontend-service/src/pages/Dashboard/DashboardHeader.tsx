import { Loop } from '@mui/icons-material';
import { Grid, Typography, useTheme } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import { BlueTitle } from '../../common/BlueTitle';
import IconButtonWithPopover from '../../common/IconButtonWithPopover';
import SearchInput from '../../common/inputs/SearchInput';
import { TopBarGrid } from '../../common/TopBar';
import { useWorkspaceStore } from '../../stores/workspace';
import { AddDashboardItem } from './AddDashboardItem';

const DashboardHeader: React.FC = () => {
    const workspace = useWorkspaceStore((state) => state.workspace);
    const theme = useTheme();

    return (
        <TopBarGrid sx={{ height: '3.6rem' }} container justifyContent="space-between" alignItems="center" wrap="nowrap">
            <Grid item>
                <Grid container spacing={5} wrap="nowrap" alignItems="center">
                    <Grid item>
                        <BlueTitle
                            title="תצוגת מערכת"
                            component="h4"
                            variant="h4"
                            style={{ fontSize: workspace.metadata.mainFontSizes.headlineTitleFontSize }}
                        />
                    </Grid>
                    <Grid item>
                        <Grid container wrap="nowrap" gap="15px">
                            <SearchInput
                                onChange={(searchValue) => console.log({ searchValue })}
                                placeholder={i18next.t('globalSearch.searchInPage')}
                                toTopBar
                            />
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>

            <Grid item>
                <Grid container spacing={1} wrap="nowrap" alignItems="center">
                    <Grid item>
                        <IconButtonWithPopover
                            popoverText="איפוס תצוגה"
                            iconButtonProps={{
                                onClick: () => console.log('rest'),
                            }}
                            style={{ borderRadius: '7px', width: '150px', height: '35px' }}
                        >
                            <Loop htmlColor={theme.palette.primary.main} />
                            <Typography fontSize={14} style={{ fontWeight: '400', padding: '0 5px', color: theme.palette.primary.main }}>
                                איפוס תצוגה
                            </Typography>
                        </IconButtonWithPopover>
                    </Grid>
                    <Grid item>
                        <AddDashboardItem />
                    </Grid>
                </Grid>
            </Grid>
        </TopBarGrid>
    );
};

export { DashboardHeader };

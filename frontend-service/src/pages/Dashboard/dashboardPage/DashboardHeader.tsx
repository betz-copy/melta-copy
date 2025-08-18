import { Loop } from '@mui/icons-material';
import { Grid, Typography, useTheme } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import { GlobalSearchBar } from '../../../common/EntitiesPage/Headline';
import IconButtonWithPopover from '../../../common/IconButtonWithPopover';
import BlueTitle from '../../../common/MeltaDesigns/BlueTitle';
import { TopBarGrid } from '../../../common/TopBar';
import { useWorkspaceStore } from '../../../stores/workspace';

const DashboardHeader: React.FC<{
    setTextSearch: React.Dispatch<React.SetStateAction<string | undefined>>;
    resetLayout: () => void;
    title: string;
    AddNewItem: React.FC;
}> = ({ setTextSearch, resetLayout, title, AddNewItem }) => {
    const workspace = useWorkspaceStore((state) => state.workspace);
    const theme = useTheme();

    return (
        <TopBarGrid sx={{ height: '3.6rem' }} container justifyContent="space-between" alignItems="center" wrap="nowrap">
            <Grid item>
                <Grid container spacing={5} wrap="nowrap" alignItems="center">
                    <Grid item>
                        <BlueTitle
                            title={title}
                            component="h4"
                            variant="h4"
                            style={{ fontSize: workspace.metadata.mainFontSizes.headlineTitleFontSize }}
                        />
                    </Grid>
                    <Grid item>
                        <Grid container wrap="nowrap" gap="15px">
                            <GlobalSearchBar
                                onSearch={(searchValue) => setTextSearch(searchValue || undefined)}
                                placeholder={i18next.t('globalSearch.searchInPage')}
                                toTopBar
                                autoSearch
                            />
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>

            <Grid item>
                <Grid container spacing={1} wrap="nowrap" alignItems="center">
                    <Grid item>
                        <IconButtonWithPopover
                            popoverText={i18next.t('dashboard.resetToDefault')}
                            iconButtonProps={{
                                onClick: () => resetLayout(),
                            }}
                            style={{ borderRadius: '7px', width: '150px', height: '35px' }}
                        >
                            <Loop htmlColor={theme.palette.primary.main} />
                            <Typography fontSize={14} style={{ fontWeight: '400', padding: '0 5px', color: theme.palette.primary.main }}>
                                {i18next.t('dashboard.resetLayout')}
                            </Typography>
                        </IconButtonWithPopover>
                    </Grid>
                    <Grid item>
                        <AddNewItem />
                    </Grid>
                </Grid>
            </Grid>
        </TopBarGrid>
    );
};

export { DashboardHeader };

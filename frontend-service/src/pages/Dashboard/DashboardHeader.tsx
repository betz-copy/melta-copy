import { Grid } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import { BlueTitle } from '../../common/BlueTitle';
import { GlobalSearchBar } from '../../common/EntitiesPage/Headline';
import { TopBarGrid } from '../../common/TopBar';
import { useWorkspaceStore } from '../../stores/workspace';
import { AddDashboardItem } from './AddDashboardItem';

const DashboardHeader: React.FC = () => {
    const workspace = useWorkspaceStore((state) => state.workspace);

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
                            <GlobalSearchBar
                                onSearch={(searchValue) => console.log({ searchValue })}
                                placeholder={i18next.t('globalSearch.searchInPage')}
                                toTopBar
                            />
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>

            <Grid item>
                <AddDashboardItem />
            </Grid>
        </TopBarGrid>
    );
};

export { DashboardHeader };

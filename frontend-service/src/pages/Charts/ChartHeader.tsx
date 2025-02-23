import { AddCircle as AddCircleIcon } from '@mui/icons-material';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import { Grid, IconButton } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import { useLocation } from 'wouter';
import { BlueTitle } from '../../common/BlueTitle';
import { GlobalSearchBar } from '../../common/EntitiesPage/Headline';
import { MeltaTooltip } from '../../common/MeltaTooltip';
import { TopBarGrid } from '../../common/TopBar';
import { environment } from '../../globals';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';

const ChartHeader: React.FC<{
    template: IMongoEntityTemplatePopulated;
    setTextSearch: React.Dispatch<React.SetStateAction<string | undefined>>;
    resetLayout: () => void;
}> = ({ template, setTextSearch, resetLayout }) => {
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
                            style={{ fontSize: environment.mainFontSizes.headlineTitleFontSize }}
                        />
                    </Grid>
                    <Grid item>
                        <Grid container wrap="nowrap" gap="15px">
                            <GlobalSearchBar
                                onSearch={(searchValue) => setTextSearch(searchValue || undefined)}
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
                <IconButton onClick={() => navigate(`${currentLocation}/chart`)}>
                    <AddCircleIcon color="primary" fontSize="large" />
                </IconButton>
            </Grid>
        </TopBarGrid>
    );
};

export { ChartHeader };

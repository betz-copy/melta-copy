import { AddCircle as AddCircleIcon } from '@mui/icons-material';
import { Grid, IconButton } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import { useLocation } from 'wouter';
import { BlueTitle } from '../../common/BlueTitle';
import { TopBarGrid } from '../../common/TopBar';
import { environment } from '../../globals';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';

const ChartHeader: React.FC<{ template: IMongoEntityTemplatePopulated }> = ({ template }) => {
    const [currentLocation, navigate] = useLocation();

    return (
        <TopBarGrid sx={{ height: '3.6rem' }} container justifyContent="space-between" alignItems="center" wrap="nowrap">
            <Grid item>
                <Grid container spacing={5} wrap="nowrap" alignItems="center">
                    <Grid item>
                        <BlueTitle
                            title={`${i18next.t('pages.charts')} ${template.displayName}`}
                            component="h4"
                            variant="h4"
                            style={{ fontSize: environment.mainFontSizes.headlineTitleFontSize }}
                        />
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

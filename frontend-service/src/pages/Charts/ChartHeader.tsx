import { Grid, IconButton } from '@mui/material';
import i18next from 'i18next';
import React, { useState } from 'react';
import { AddCircle as AddCircleIcon } from '@mui/icons-material';
import { BlueTitle } from '../../common/BlueTitle';
import { TopBarGrid } from '../../common/TopBar';
import { environment } from '../../globals';
import { ChartWizard } from '../../common/wizards/charts';

const ChartHeader: React.FC = () => {
    const [addChartDialog, setAddChartDialog] = useState(false);

    return (
        <TopBarGrid sx={{ height: '3.6rem' }} container justifyContent="space-between" alignItems="center" wrap="nowrap">
            <Grid item>
                <Grid container spacing={5} wrap="nowrap" alignItems="center">
                    <Grid item>
                        <BlueTitle
                            title={i18next.t('pages.charts')}
                            component="h4"
                            variant="h4"
                            style={{ fontSize: environment.mainFontSizes.headlineTitleFontSize }}
                        />
                    </Grid>
                </Grid>
            </Grid>

            <Grid item>
                <IconButton onClick={() => setAddChartDialog(true)}>
                    <AddCircleIcon color="primary" fontSize="large" />
                </IconButton>
            </Grid>
            <ChartWizard open={addChartDialog} handleClose={() => setAddChartDialog(false)} />
        </TopBarGrid>
    );
};
export { ChartHeader };

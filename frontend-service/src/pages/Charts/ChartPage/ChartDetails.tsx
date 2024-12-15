import { Grid, TextField, ToggleButton, ToggleButtonGroup, Typography, useTheme } from '@mui/material';
import React from 'react';
import { PermIdentity as PersonalIcon, Group as AllUsers } from '@mui/icons-material';
import i18next from 'i18next';
import { MeltaTooltip } from '../../../common/MeltaTooltip';
import { ChartTypesEdit } from './ChartTypesEdit';

const ChartDetails: React.FC<{
    xAxis: string;
    setXAxis: React.Dispatch<React.SetStateAction<string>>;
    yAxis: string;
    setYAxis: React.Dispatch<React.SetStateAction<string>>;
}> = ({ xAxis, setXAxis, yAxis, setYAxis }) => {
    const theme = useTheme();

    return (
        <Grid container direction="column">
            <Grid item>
                <Typography variant="h6">{i18next.t('charts.visualDefinition')}</Typography>
            </Grid>

            <Grid item>
                <Typography variant="subtitle1">{i18next.t('charts.generalDetails')}</Typography>
                <Grid container direction="column" spacing={2} marginTop={1}>
                    <Grid item>
                        <TextField
                            placeholder={i18next.t('charts.name')}
                            label={i18next.t('charts.name')}
                            variant="outlined"
                            sx={{ width: '400px' }}
                        />
                    </Grid>
                    <Grid item>
                        <TextField
                            multiline
                            placeholder={i18next.t('charts.description')}
                            label={i18next.t('charts.description')}
                            rows={4}
                            variant="outlined"
                            sx={{ width: '400px' }}
                        />
                    </Grid>
                </Grid>
            </Grid>

            <ChartTypesEdit xAxis={xAxis} setXAxis={setXAxis} yAxis={yAxis} setYAxis={setYAxis} />

            <Grid container direction="column" marginTop={2} spacing={2}>
                <Grid item>
                    <Typography variant="subtitle1">{i18next.t('charts.permissions')}</Typography>
                </Grid>
                <Grid item>
                    <ToggleButtonGroup
                        exclusive
                        id="permissions"
                        color="primary"
                        size="small"
                        sx={{ height: '35px', color: 'red' }}
                        // value={}
                        onChange={(_event: React.MouseEvent<HTMLElement>, newIsDailyAlert: boolean) => {
                            console.log('hi', newIsDailyAlert);
                        }}
                    >
                        <ToggleButton
                            value
                            sx={{
                                '&.Mui-selected': {
                                    backgroundColor: theme.palette.primary.main,
                                    color: 'white',
                                },
                            }}
                        >
                            <MeltaTooltip title={i18next.t('charts.personal')}>
                                <PersonalIcon />
                            </MeltaTooltip>
                        </ToggleButton>
                        <ToggleButton value={false}>
                            <MeltaTooltip title={i18next.t('charts.protected')}>
                                <AllUsers />
                            </MeltaTooltip>
                        </ToggleButton>
                    </ToggleButtonGroup>
                </Grid>
            </Grid>
        </Grid>
    );
};

export { ChartDetails };

import { Group as AllUsers, PermIdentity as PersonalIcon } from '@mui/icons-material';
import { Grid, TextField, ToggleButton, ToggleButtonGroup, Typography, useTheme } from '@mui/material';
import { FormikProps } from 'formik';
import i18next from 'i18next';
import React from 'react';
import { MeltaTooltip } from '../../../common/MeltaTooltip';
import { IBasicChart } from '../../../interfaces/charts';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { ChartTypesEdit } from './ChartTypesEdit';

const ChartSideBar: React.FC<{
    formik: FormikProps<IBasicChart>;
    entityTemplate: IMongoEntityTemplatePopulated;
}> = ({ formik, entityTemplate }) => {
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
                            id="name"
                            name="name"
                            label={i18next.t('charts.name')}
                            placeholder={i18next.t('charts.name')}
                            value={formik.values.name}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={formik.touched.name && Boolean(formik.errors.name)}
                            helperText={formik.touched.name && formik.errors.name}
                            variant="outlined"
                            sx={{ width: '400px' }}
                        />
                    </Grid>
                    <Grid item>
                        <TextField
                            id="description"
                            name="description"
                            multiline
                            label={i18next.t('charts.description')}
                            placeholder={i18next.t('charts.description')}
                            value={formik.values.description}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={formik.touched.description && Boolean(formik.errors.description)}
                            helperText={formik.touched.description && formik.errors.description}
                            variant="outlined"
                            rows={4}
                            sx={{ width: '400px' }}
                        />
                    </Grid>
                </Grid>
            </Grid>

            <ChartTypesEdit formik={formik} formikValues={formik.values} entityTemplate={entityTemplate} />

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

export { ChartSideBar };

import { Grid } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import { InfoTypography } from '../../../common/InfoTypography';
import { StepComponentProps } from '../../../common/wizards';
import { ViewMode } from '../../../interfaces/dashboard';
import { IFrame } from '../../../interfaces/iFrames';
import { ViewModeTextField } from '../../../common/inputs/ViewModeTextField';

const SideBarDetails: React.FC<StepComponentProps<IFrame> & { viewMode: ViewMode }> = ({ values, touched, errors, handleChange, viewMode }) => {
    return (
        <Grid container direction="column" spacing={4}>
            <Grid item container direction="column" spacing={4}>
                <Grid item container direction="column" spacing={2.5}>
                    <Grid item>
                        <ViewModeTextField
                            name="name"
                            label={i18next.t('charts.name')}
                            placeholder={i18next.t('charts.name')}
                            value={values.name}
                            onChange={handleChange}
                            error={touched.name && Boolean(errors.name)}
                            helperText={touched.name && errors.name}
                            fullWidth
                            readOnly={viewMode === ViewMode.ReadOnly}
                        />
                    </Grid>

                    <Grid item>
                        <ViewModeTextField
                            name="url"
                            label="קישור"
                            placeholder="קישור"
                            value={values.url}
                            onChange={handleChange}
                            error={touched.url && Boolean(errors.url)}
                            helperText={touched.url && errors.url}
                            fullWidth
                            readOnly={viewMode === ViewMode.ReadOnly}
                            multiline
                        />
                    </Grid>
                </Grid>

                <Grid item>
                    <InfoTypography text={i18next.t('dashboard.iframes.permissionWarning')} />
                </Grid>
            </Grid>
        </Grid>
    );
};

export { SideBarDetails };

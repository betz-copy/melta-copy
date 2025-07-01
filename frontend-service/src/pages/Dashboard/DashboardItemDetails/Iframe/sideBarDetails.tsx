import { Grid } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import { InfoTypography } from '../../../../common/InfoTypography';
import { ViewModeTextField } from '../../../../common/inputs/ViewModeTextField';
import { StepComponentProps } from '../../../../common/wizards';
import { IFrameWizardValues } from '../../../../common/wizards/iFrame';
import { ViewMode } from '../../../../interfaces/dashboard';

const SideBarDetails: React.FC<StepComponentProps<IFrameWizardValues> & { viewMode: ViewMode }> = ({
    values,
    touched,
    errors,
    handleChange,
    viewMode,
    handleBlur,
}) => {
    return (
        <Grid container direction="column" spacing={4}>
            <Grid item container direction="column" spacing={4}>
                <Grid item container direction="column" spacing={2.5}>
                    <Grid item>
                        <ViewModeTextField
                            name="name"
                            label={i18next.t('wizard.name')}
                            placeholder={i18next.t('wizard.name')}
                            value={values.name}
                            onChange={handleChange}
                            error={touched.name && Boolean(errors.name)}
                            helperText={touched.name && errors.name}
                            readOnly={viewMode === ViewMode.ReadOnly}
                            fullWidth
                        />
                    </Grid>

                    <Grid item>
                        <ViewModeTextField
                            name="url"
                            label={i18next.t('dashboard.iframes.url')}
                            placeholder={i18next.t('dashboard.iframes.url')}
                            value={values.url}
                            onChange={handleChange}
                            error={touched.url && Boolean(errors.url)}
                            helperText={touched.url && errors.url}
                            readOnly={viewMode === ViewMode.ReadOnly}
                            fullWidth
                            multiline
                            onBlur={handleBlur}
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

export default SideBarDetails;

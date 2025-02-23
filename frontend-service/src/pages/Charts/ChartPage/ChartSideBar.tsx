import { Group as AllUsers, PermIdentity as PersonalIcon } from '@mui/icons-material';
import { Grid, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { FormikProps } from 'formik';
import i18next from 'i18next';
import React from 'react';
import { MeltaTooltip } from '../../../common/MeltaTooltip';
import { IBasicChart, IPermission } from '../../../interfaces/charts';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { useUserStore } from '../../../stores/user';
import { isWorkspaceAdmin } from '../../../utils/permissions/instancePermissions';
import { ChartTypesEdit } from './ChartTypesEdit';

const ChartSideBar: React.FC<{
    formik: FormikProps<IBasicChart>;
    entityTemplate: IMongoEntityTemplatePopulated;
    edit: boolean;
    readonly: boolean;
}> = ({ formik, entityTemplate, edit, readonly }) => {
    const currentUser = useUserStore();

    return (
        <Grid container direction="column" padding="20px">
            <Grid item>
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
                            variant={readonly ? 'standard' : 'outlined'}
                            sx={{ width: '90%' }}
                            inputProps={{
                                readOnly: readonly,
                                style: {
                                    textOverflow: 'ellipsis',
                                },
                            }}
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
                            variant={readonly ? 'standard' : 'outlined'}
                            rows={formik.values.description || !readonly ? 4 : 1}
                            sx={{ width: '90%' }}
                            inputProps={{
                                readOnly: readonly,
                                style: {
                                    textOverflow: 'ellipsis',
                                },
                            }}
                        />
                    </Grid>
                </Grid>
            </Grid>

            <Grid item>
                <ChartTypesEdit formik={formik} formikValues={formik.values} entityTemplate={entityTemplate} disabled={readonly} />
            </Grid>

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
                        sx={{ height: '35px' }}
                        value={formik.values.permission}
                        onChange={(_event: React.MouseEvent<HTMLElement>, permission: IPermission) => {
                            formik.setFieldValue('permission', permission);
                        }}
                        disabled={
                            readonly ||
                            (edit &&
                                (formik.values.createdBy !== currentUser.user._id || !isWorkspaceAdmin(currentUser.user.currentWorkspacePermissions)))
                        }
                    >
                        <ToggleButton value={IPermission.Private}>
                            <MeltaTooltip title={i18next.t('charts.personal')}>
                                <PersonalIcon />
                            </MeltaTooltip>
                        </ToggleButton>
                        <ToggleButton value={IPermission.Protected}>
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

import { Group as AllUsers, PermIdentity as PersonalIcon } from '@mui/icons-material';
import {
    Autocomplete,
    Box,
    FormControl,
    FormControlLabel,
    FormLabel,
    Grid,
    Radio,
    RadioGroup,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
} from '@mui/material';
import { FormikProps } from 'formik';
import i18next from 'i18next';
import React, { useState, useEffect } from 'react';
import { useQueryClient } from 'react-query';
import { IBasicChart, IChart, IPermission } from '../../../interfaces/charts';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { useUserStore } from '../../../stores/user';
import { isWorkspaceAdmin } from '../../../utils/permissions/instancePermissions';
import { ChartTypesEdit } from './ChartTypesEdit';
import { StepComponentProps } from '../../../common/wizards';

const ChartSideBar: React.FC<StepComponentProps<IChart>> = (props) => {
    const { values, errors, touched, handleChange, setFieldValue } = props as FormikProps<IBasicChart>;
    const currentUser = useUserStore();
    const queryClient = useQueryClient();
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;

    const [chartMode, setChartMode] = useState<'new' | 'exist'>('new');

    return (
        <Grid container direction="column" spacing={2}>
            <Grid item>
                <Autocomplete
                    value={values.templateId || null}
                    onChange={(_e, newValue) => setFieldValue('templateId', newValue || null)}
                    options={Array.from(entityTemplates.keys())}
                    getOptionLabel={(id) => entityTemplates.get(id)?.displayName || id}
                    renderInput={(params) => <TextField {...params} label={i18next.t('entity')} fullWidth />}
                />
            </Grid>

            {values.templateId && (
                <>
                    <Grid item>
                        <FormControl>
                            <RadioGroup row name="actionOnFail" onChange={(_e, newValue) => setChartMode(newValue)} value={chartMode}>
                                <FormControlLabel value="new" control={<Radio />} label="חדש" />
                                <FormControlLabel value="exist" control={<Radio />} label="קיים" />
                            </RadioGroup>
                        </FormControl>
                    </Grid>
                    {chartMode === 'new' ? (
                        <>
                            <Grid item>
                                <TextField
                                    id="name"
                                    name="name"
                                    label={i18next.t('charts.name')}
                                    placeholder={i18next.t('charts.name')}
                                    value={values.name}
                                    onChange={handleChange}
                                    error={touched.name && Boolean(errors.name)}
                                    helperText={touched.name && errors.name}
                                    sx={{ width: '100%' }}
                                    inputProps={{
                                        style: { textOverflow: 'ellipsis' },
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
                                    value={values.description}
                                    onChange={handleChange}
                                    error={touched.description && Boolean(errors.description)}
                                    helperText={touched.description && errors.description}
                                    maxRows={4}
                                    sx={{ width: '100%' }}
                                    inputProps={{
                                        style: { textOverflow: 'ellipsis' },
                                    }}
                                />
                            </Grid>

                            <Grid item>
                                <ChartTypesEdit
                                    formik={props}
                                    formikValues={values}
                                    entityTemplate={entityTemplates.get(values.templateId)!}
                                    disabled={false}
                                />
                            </Grid>

                            <Grid item>
                                <Typography variant="subtitle1">{i18next.t('charts.permissions')}</Typography>
                                <ToggleButtonGroup
                                    exclusive
                                    id="permissions"
                                    color="primary"
                                    size="small"
                                    sx={{ height: '35px' }}
                                    value={values.permission}
                                    onChange={(_event, permission: IPermission) => {
                                        if (permission !== null) setFieldValue('permission', permission);
                                    }}
                                    // disabled={
                                    //     edit &&
                                    //     values.createdBy !== currentUser.user._id &&
                                    //     !isWorkspaceAdmin(currentUser.user.currentWorkspacePermissions)
                                    // }
                                >
                                    <ToggleButton value={IPermission.Private}>
                                        <PersonalIcon />
                                    </ToggleButton>
                                    <ToggleButton value={IPermission.Protected}>
                                        <AllUsers />
                                    </ToggleButton>
                                </ToggleButtonGroup>
                            </Grid>
                        </>
                    ) : (
                        /// todo: bring all existing charts and
                        <h1>hi</h1>
                    )}
                </>
            )}
        </Grid>
    );
};

export { ChartSideBar };

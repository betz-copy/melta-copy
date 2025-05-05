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
import { IBasicChart, IPermission } from '../../../interfaces/charts';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { useUserStore } from '../../../stores/user';
import { isWorkspaceAdmin } from '../../../utils/permissions/instancePermissions';
import { ChartTypesEdit } from './ChartTypesEdit';

interface ChartSideBarProps {
    formik: FormikProps<IBasicChart>;
    entityTemplates: Map<string, IMongoEntityTemplatePopulated>;
    defaultTemplateId?: string;
    edit: boolean;
    readonly: boolean;
    onTemplateChange?: (templateId: string) => void;
    selectedTemplate: IMongoEntityTemplatePopulated | undefined;
}

const ChartSideBar: React.FC<ChartSideBarProps> = ({ formik, entityTemplates, selectedTemplate, edit, readonly, onTemplateChange }) => {
    const currentUser = useUserStore();
    const [chartMode, setChartMode] = useState<'new' | 'exist'>('new');

    return (
        <Grid container direction="column" spacing={2}>
            <Grid item>
                <Autocomplete
                    value={selectedTemplate?._id || null}
                    onChange={(_e, newValue) => onTemplateChange?.(newValue)}
                    options={Array.from(entityTemplates.keys())}
                    getOptionLabel={(id) => entityTemplates.get(id)?.displayName || id}
                    renderInput={(params) => <TextField {...params} label={i18next.t('entity')} fullWidth />}
                />
            </Grid>

            {selectedTemplate && (
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
                                    value={formik.values.name}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    error={formik.touched.name && Boolean(formik.errors.name)}
                                    helperText={formik.touched.name && formik.errors.name}
                                    variant={readonly ? 'standard' : 'outlined'}
                                    sx={{ width: '100%' }}
                                    inputProps={{
                                        readOnly: readonly,
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
                                    value={formik.values.description}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    error={formik.touched.description && Boolean(formik.errors.description)}
                                    helperText={formik.touched.description && formik.errors.description}
                                    variant={readonly ? 'standard' : 'outlined'}
                                    maxRows={4}
                                    sx={{ width: '100%' }}
                                    inputProps={{
                                        readOnly: readonly,
                                        style: { textOverflow: 'ellipsis' },
                                    }}
                                />
                            </Grid>

                            <Grid item>
                                <ChartTypesEdit formik={formik} formikValues={formik.values} entityTemplate={selectedTemplate} disabled={readonly} />
                            </Grid>

                            <Grid item>
                                <Typography variant="subtitle1">{i18next.t('charts.permissions')}</Typography>
                                <ToggleButtonGroup
                                    exclusive
                                    id="permissions"
                                    color="primary"
                                    size="small"
                                    sx={{ height: '35px' }}
                                    value={formik.values.permission}
                                    onChange={(_event, permission: IPermission) => {
                                        if (permission !== null) formik.setFieldValue('permission', permission);
                                    }}
                                    disabled={
                                        readonly ||
                                        (edit &&
                                            formik.values.createdBy !== currentUser.user._id &&
                                            !isWorkspaceAdmin(currentUser.user.currentWorkspacePermissions))
                                    }
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

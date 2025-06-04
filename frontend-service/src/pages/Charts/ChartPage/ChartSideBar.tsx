import { Group as AllUsers, InfoOutlined, PermIdentity as PersonalIcon } from '@mui/icons-material';
import {
    Autocomplete,
    Divider,
    FormControl,
    FormControlLabel,
    Grid,
    Radio,
    RadioGroup,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
    useTheme,
} from '@mui/material';
import { FormikProps } from 'formik';
import i18next from 'i18next';
import React, { useState } from 'react';
import { IoIosArrowDown } from 'react-icons/io';
import { useQueryClient } from 'react-query';
import { StepComponentProps } from '../../../common/wizards';
import { IChart, IPermission } from '../../../interfaces/charts';
import { ViewMode } from '../../../interfaces/dashboard';
import { IEntityTemplateMap } from '../../../interfaces/entityTemplates';
import { useUserStore } from '../../../stores/user';
import { initialValues } from '../../../utils/charts/getChartAxes';
import { ChartAutoComplete } from '../../Dashboard/Chart/chartsAutoComplete';
import { ConfirmEditPermissionCommonItem } from '../../Dashboard/Dialogs';
import { ChartTypesEdit } from './ChartTypesEdit';
import { ReadOnlyTextField } from '../../../common/inputs/FilterInputs/StyledFilterInput';

const ChartSideBar: React.FC<StepComponentProps<IChart> & { isDashboardPage: boolean; viewMode: ViewMode }> = (props) => {
    const { isDashboardPage, viewMode } = props;
    const { values, setValues, errors, touched, handleChange, setFieldValue } = props as FormikProps<IChart>;

    const currentUser = useUserStore();
    const queryClient = useQueryClient();
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const theme = useTheme();
    console.log({ isDashboardPage, values });

    const [chartMode, setChartMode] = useState<'new' | 'exist'>(values._id && viewMode === ViewMode.Add ? 'exist' : 'new');
    const [permissionDialogWarningOpen, setPermissionDialogWarningOpen] = useState<boolean>(false);

    console.log({ values, chartMode });

    return (
        <Grid container direction="column" width="100%">
            <Grid item>
                <Grid container direction="column" spacing={2} marginTop={1}>
                    <Grid item>
                        <ReadOnlyTextField
                            name="name"
                            label={i18next.t('charts.name')}
                            placeholder={i18next.t('charts.name')}
                            value={values.name}
                            onChange={handleChange}
                            error={touched.name && Boolean(errors.name)}
                            helperText={touched.name && errors.name}
                            variant={viewMode === ViewMode.ReadOnly ? 'standard' : 'outlined'}
                            sx={{ width: '100%' }}
                            readOnly={viewMode === ViewMode.ReadOnly}
                        />
                    </Grid>
                    <Grid item>
                        <TextField
                            id="description"
                            name="description"
                            multiline
                            label={i18next.t('charts.description')}
                            placeholder={i18next.t('charts.description')}
                            value={values.description || (viewMode === ViewMode.ReadOnly ? '-' : '')}
                            onChange={handleChange}
                            error={touched.description && Boolean(errors.description)}
                            helperText={touched.description && errors.description}
                            variant={viewMode === ViewMode.ReadOnly ? 'standard' : 'outlined'}
                            maxRows={4}
                            sx={{ width: '100%' }}
                            InputProps={{
                                readOnly: viewMode === ViewMode.ReadOnly,
                                disableUnderline: viewMode === ViewMode.ReadOnly,
                                style: { textOverflow: 'ellipsis' },
                            }}
                        />
                    </Grid>
                </Grid>
            </Grid>

            <Grid item>
                <ChartTypesEdit
                    formik={props}
                    formikValues={values}
                    entityTemplate={entityTemplates.get(values.templateId || '')!}
                    disabled={viewMode === ViewMode.ReadOnly}
                />
            </Grid>

            <Grid container direction="column" marginTop={2} spacing={2}>
                <Grid item>
                    <Autocomplete
                        value={values.templateId || null}
                        onChange={(_e, newValue) => setFieldValue('templateId', newValue || null)}
                        options={Array.from(entityTemplates.keys())}
                        getOptionLabel={(id) => entityTemplates.get(id)?.displayName || id}
                        renderInput={(params) => <TextField {...params} label={i18next.t('entity')} fullWidth />}
                        popupIcon={<IoIosArrowDown fontSize="Medium" />}
                        sx={{ width: 295 }}
                    />
                </Grid>
            </Grid>

            {values.templateId && (
                <>
                    {isDashboardPage && viewMode === ViewMode.Add && (
                        <Grid item>
                            <FormControl sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <Typography fontSize="14px" fontWeight="14px" color="#9398C2">
                                    יצירת תרשים
                                </Typography>
                                <RadioGroup
                                    row
                                    name="actionOnFail"
                                    onChange={(_e, newValue) => {
                                        setChartMode(newValue);
                                        setValues({ ...initialValues, templateId: values.templateId });
                                    }}
                                    value={chartMode}
                                    sx={{ display: 'flex', flexDirection: 'row', gap: 4 }}
                                >
                                    <FormControlLabel
                                        value="new"
                                        control={<Radio />}
                                        label="חדש"
                                        sx={{
                                            '& .MuiFormControlLabel-label': {
                                                fontSize: '14px',
                                                color: '#444',
                                            },
                                        }}
                                    />
                                    <FormControlLabel
                                        value="exist"
                                        control={<Radio />}
                                        label="קיים"
                                        sx={{
                                            '& .MuiFormControlLabel-label': {
                                                fontSize: '14px',
                                                color: '#444',
                                            },
                                        }}
                                    />
                                </RadioGroup>
                            </FormControl>
                        </Grid>
                    )}

                    {chartMode === 'new' || viewMode !== ViewMode.Add ? (
                        <Grid item container direction="column" spacing={4}>
                            {isDashboardPage && viewMode === ViewMode.Add && (
                                <Grid item>
                                    <Divider />
                                </Grid>
                            )}
                            <Grid item container direction="column" spacing={2}>
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
                                        sx={{ width: 295 }}
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
                                        sx={{ width: 295 }}
                                        inputProps={{
                                            style: { textOverflow: 'ellipsis' },
                                        }}
                                    />
                                </Grid>

                                <Grid item marginTop={2}>
                                    <ChartTypesEdit
                                        formik={props}
                                        formikValues={values}
                                        entityTemplate={entityTemplates.get(values.templateId)!}
                                        disabled={false}
                                    />
                                </Grid>
                                {/* ask if not to show it in dashboard page in create/ edit */}
                                <Grid item container direction="column" spacing={2}>
                                    <Grid item>
                                        <Typography fontSize="14px" fontWeight="14px" color="#9398C2">
                                            {i18next.t('charts.permissions')}
                                        </Typography>
                                    </Grid>
                                    <Grid item>
                                        {/* todo: check why i dont see the toopltip */}
                                        <ToggleButtonGroup
                                            exclusive
                                            id="permissions"
                                            color="primary"
                                            size="small"
                                            sx={{ height: '35px' }}
                                            value={values.permission}
                                            onChange={(_event, permission: IPermission) => {
                                                if (permission === null) return;
                                                if (values.usedInDashboard && values.permission === IPermission.Protected)
                                                    setPermissionDialogWarningOpen(true);
                                                else setFieldValue('permission', permission);
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
                                </Grid>
                                <Grid item container direction="row" alignItems="center" wrap="nowrap" gap={1.5} marginTop={2}>
                                    <InfoOutlined style={{ color: theme.palette.primary.main }} />
                                    <Typography fontWeight={400} fontSize={14} color="#53566E">
                                        טבלה זו והמידע המוצג בה תופיע לכלל המשתמשים בהתאם להרשאותיהם
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Grid>
                    ) : (
                        <Grid item>
                            <ChartAutoComplete formikProps={props} />
                        </Grid>
                    )}
                </>
            )}

            <ConfirmEditPermissionCommonItem
                isDialogOpen={permissionDialogWarningOpen}
                handleClose={() => setPermissionDialogWarningOpen(false)}
                onEditYes={() => {
                    setFieldValue('permission', IPermission.Private);
                    setPermissionDialogWarningOpen(false);
                }}
            />
        </Grid>
    );
};

export { ChartSideBar };

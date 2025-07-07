import { Group as AllUsers, PermIdentity as PersonalIcon } from '@mui/icons-material';
import {
    Box,
    Divider,
    FormControl,
    FormControlLabel,
    Grid,
    Radio,
    RadioGroup,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
    useTheme,
} from '@mui/material';
import { FormikProps } from 'formik';
import i18next from 'i18next';
import React, { useState } from 'react';
import { useQueryClient } from 'react-query';
import { InfoTypography } from '../../../common/InfoTypography';
import { FormikAutoComplete } from '../../../common/inputs/FormikAutoComplete';
import { ViewModeTextField } from '../../../common/inputs/ViewModeTextField';
import { MeltaTooltip } from '../../../common/MeltaTooltip';
import { StepComponentProps } from '../../../common/wizards';
import { IChart, IPermission } from '../../../interfaces/charts';
import { ChartForm, DashboardItemType, ViewMode } from '../../../interfaces/dashboard';
import { IEntityTemplateMap } from '../../../interfaces/entityTemplates';
import { useUserStore } from '../../../stores/user';
import { initialValues } from '../../../utils/charts/getChartAxes';
import { dashboardInitialValues } from '../../../utils/dashboard/formik';
import { isWorkspaceAdmin } from '../../../utils/permissions/instancePermissions';
import ChartAutoComplete from '../../Dashboard/DashboardItemDetails/Chart/chartsAutoComplete';
import { ChangeTemplate, ConfirmEditPermissionCommonItem } from '../../Dashboard/Dialogs';
import { ChartTypesEdit } from './ChartTypesEdit';
import { getCurrentTemplate } from '../../Dashboard/DashboardItemDetails/Chart/BodyComponent';

const ChartSideBar: React.FC<StepComponentProps<ChartForm> & { isDashboardPage: boolean; viewMode: ViewMode }> = (props) => {
    const { isDashboardPage, viewMode } = props;
    const { values, setValues, errors, touched, handleChange, setFieldValue } = props as FormikProps<IChart & { _id?: string }>;

    const currentUser = useUserStore();
    const theme = useTheme();
    const queryClient = useQueryClient();
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const [chartMode, setChartMode] = useState<'new' | 'exist'>(values._id && viewMode === ViewMode.Add ? 'exist' : 'new');
    const [permissionDialogWarningOpen, setPermissionDialogWarningOpen] = useState<boolean>(false);
    const [changeTemplateWarning, setChangeTemplateWarning] = useState<{ isOpen: boolean; newTemplate: string | string[] | null }>({
        isOpen: false,
        newTemplate: null,
    });
    const template = getCurrentTemplate(entityTemplates, values.templateId, values.childTemplateId);

    return (
        <Grid container direction="column" spacing={3} wrap="nowrap">
            {isDashboardPage && (
                <Grid item>
                    <FormikAutoComplete
                        formik={props}
                        formikField="templateId"
                        options={Array.from(entityTemplates.keys())}
                        label={i18next.t('entity')}
                        onChange={(newValue) => {
                            if (values.templateId) setChangeTemplateWarning({ isOpen: true, newTemplate: newValue });
                            else setFieldValue('templateId', newValue || '');
                        }}
                        getOptionLabel={(id) => entityTemplates.get(id)?.displayName || id}
                        multiple={false}
                        readonly={viewMode === ViewMode.ReadOnly}
                        style={{ width: 295 }}
                    />
                </Grid>
            )}
            {values.templateId && (
                <>
                    {isDashboardPage && viewMode === ViewMode.Add && (
                        <Grid item>
                            <FormControl sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <Typography fontSize="14px" fontWeight="14px" color={theme.palette.text.primary}>
                                    {i18next.t('dashboard.charts.createChart')}
                                </Typography>
                                <RadioGroup
                                    row
                                    name="actionOnFail"
                                    onChange={(_e, newValue) => {
                                        setChartMode(newValue as 'new' | 'exist');
                                        setValues((prevValues) => ({
                                            ...prevValues,
                                            ...initialValues,
                                            templateId: prevValues.templateId,
                                        }));
                                    }}
                                    value={chartMode}
                                    sx={{ display: 'flex', flexDirection: 'row', gap: 4 }}
                                >
                                    <FormControlLabel
                                        value="new"
                                        control={<Radio />}
                                        label={i18next.t('dashboard.charts.new')}
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
                                        label={i18next.t('dashboard.charts.existing')}
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
                                    <ViewModeTextField
                                        id="name"
                                        name="name"
                                        label={i18next.t('charts.name')}
                                        placeholder={i18next.t('charts.name')}
                                        value={values.name}
                                        onChange={handleChange}
                                        error={touched.name && Boolean(errors.name)}
                                        helperText={touched.name && errors.name}
                                        sx={{ width: 295 }}
                                        readOnly={viewMode === ViewMode.ReadOnly}
                                    />
                                </Grid>
                                <Grid item>
                                    <ViewModeTextField
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
                                        readOnly={viewMode === ViewMode.ReadOnly}
                                    />
                                </Grid>

                                <Grid item marginTop={2}>
                                    <ChartTypesEdit formik={props} entityTemplate={template} disabled={viewMode === ViewMode.ReadOnly} />
                                </Grid>

                                <Grid item container direction="column" spacing={2}>
                                    <Grid item>
                                        <Typography fontSize="14px" fontWeight="14px" color="#9398C2">
                                            {i18next.t('charts.permissions')}
                                        </Typography>
                                    </Grid>
                                    <Grid item>
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
                                            disabled={
                                                viewMode === ViewMode.ReadOnly ||
                                                (viewMode === ViewMode.Edit &&
                                                    values.createdBy !== currentUser.user._id &&
                                                    !isWorkspaceAdmin(currentUser.user.currentWorkspacePermissions))
                                            }
                                        >
                                            {!isDashboardPage && (
                                                <MeltaTooltip title={i18next.t('charts.personal')}>
                                                    <Box>
                                                        <ToggleButton value={IPermission.Private}>
                                                            <PersonalIcon />
                                                        </ToggleButton>
                                                    </Box>
                                                </MeltaTooltip>
                                            )}
                                            <MeltaTooltip title={i18next.t('charts.protected')}>
                                                <Box>
                                                    <ToggleButton value={IPermission.Protected}>
                                                        <AllUsers />
                                                    </ToggleButton>
                                                </Box>
                                            </MeltaTooltip>
                                        </ToggleButtonGroup>
                                    </Grid>
                                </Grid>
                                {values.permission === IPermission.Protected && (
                                    <Grid item>
                                        <InfoTypography text={i18next.t('dashboard.charts.permissionWarning')} />
                                    </Grid>
                                )}
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

            <ChangeTemplate
                isDialogOpen={changeTemplateWarning.isOpen}
                onYes={() => {
                    setValues({ ...dashboardInitialValues.chart, filter: undefined });
                    setFieldValue('templateId', changeTemplateWarning.newTemplate || '');
                    setChangeTemplateWarning({ isOpen: false, newTemplate: null });
                }}
                handleClose={() => setChangeTemplateWarning({ isOpen: false, newTemplate: null })}
                type={DashboardItemType.Chart}
            />
        </Grid>
    );
};

export default ChartSideBar;

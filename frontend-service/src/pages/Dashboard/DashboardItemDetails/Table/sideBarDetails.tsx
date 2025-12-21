import { Divider, Grid } from '@mui/material';
import { IChildTemplateMap } from '@packages/child-template';
import { DashboardItemType } from '@packages/dashboard';
import { IEntityTemplateMap } from '@packages/entity-template';
import i18next from 'i18next';
import React, { useState } from 'react';
import { useQueryClient } from 'react-query';
import { InfoTypography } from '../../../../common/InfoTypography';
import { FormikAutoComplete } from '../../../../common/inputs/FormikAutoComplete';
import { ViewModeTextField } from '../../../../common/inputs/ViewModeTextField';
import { StepComponentProps } from '../../../../common/wizards';
import { TableForm, ViewMode } from '../../../../interfaces/dashboard';
import { dashboardInitialValues, getTemplateProperties } from '../../../../utils/dashboard/formik';
import { ChangeTemplate } from '../../Dialogs';

const SideBarDetails: React.FC<StepComponentProps<TableForm> & { viewMode: ViewMode }> = ({ viewMode, ...formikProps }) => {
    const { values, errors, touched, handleChange, setFieldValue, setValues } = formikProps;

    const queryClient = useQueryClient();
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const childTemplates = queryClient.getQueryData<IChildTemplateMap>('getChildTemplates')!;

    const entityTemplatesIds = [...entityTemplates.keys(), ...childTemplates.keys()];

    const [changeTemplateWarning, setChangeTemplateWarning] = useState<{ isOpen: boolean; newTemplate: string | string[] | null }>({
        isOpen: false,
        newTemplate: null,
    });

    const handleChangeTemplate = (newValue: string[] | string | null) => {
        const childTemplate = childTemplates.get(newValue as string);

        setFieldValue('templateId', childTemplate?.parentTemplate._id || newValue || null);
        setFieldValue('childTemplateId', childTemplate?._id || null);

        if (typeof newValue === 'string') setFieldValue('columns', getTemplateProperties(childTemplate ? childTemplates : entityTemplates, newValue));
    };

    return (
        <Grid container direction="column" spacing={4}>
            <Grid>
                <FormikAutoComplete
                    formik={formikProps}
                    formikField={values.childTemplateId ? 'childTemplateId' : 'templateId'}
                    options={entityTemplatesIds}
                    label={i18next.t('entityTemplate')}
                    onChange={(newValue) => {
                        if (values.templateId) setChangeTemplateWarning({ isOpen: true, newTemplate: newValue });
                        else handleChangeTemplate(newValue);
                    }}
                    getOptionLabel={(id) => childTemplates.get(id)?.displayName || entityTemplates.get(id)?.displayName || id}
                    multiple={false}
                    readonly={viewMode === ViewMode.ReadOnly}
                    style={{ width: '100%' }}
                />
            </Grid>

            {values.templateId && (
                <Grid container direction="column" spacing={4}>
                    <Grid>
                        <Divider />
                    </Grid>
                    <Grid container direction="column" spacing={2.5}>
                        <Grid>
                            <ViewModeTextField
                                name="name"
                                label={i18next.t('dashboard.tables.title')}
                                placeholder={i18next.t('dashboard.tables.title')}
                                value={values.name}
                                onChange={handleChange}
                                error={touched.name && Boolean(errors.name)}
                                helperText={touched.name && errors.name}
                                fullWidth
                                readOnly={viewMode === ViewMode.ReadOnly}
                            />
                        </Grid>

                        <Grid>
                            <ViewModeTextField
                                name="description"
                                multiline
                                label={i18next.t('charts.description')}
                                placeholder={i18next.t('charts.description')}
                                value={values.description}
                                onChange={handleChange}
                                error={touched.description && Boolean(errors.description)}
                                helperText={touched.description && errors.description}
                                fullWidth
                                maxRows={4}
                                readOnly={viewMode === ViewMode.ReadOnly}
                            />
                        </Grid>
                    </Grid>

                    <Grid container direction="column" spacing={2}>
                        <Grid>
                            <InfoTypography text={i18next.t('dashboard.tables.permissionWarning')} />
                        </Grid>
                        <Grid>
                            <InfoTypography text={i18next.t('dashboard.tables.changeTableSizeWarning')} />
                        </Grid>
                    </Grid>
                </Grid>
            )}

            <ChangeTemplate
                isDialogOpen={changeTemplateWarning.isOpen}
                onYes={() => {
                    setValues(dashboardInitialValues.table);
                    handleChangeTemplate(changeTemplateWarning.newTemplate);
                    setChangeTemplateWarning({ isOpen: false, newTemplate: null });
                }}
                handleClose={() => setChangeTemplateWarning({ isOpen: false, newTemplate: null })}
                type={DashboardItemType.Table}
            />
        </Grid>
    );
};

export default SideBarDetails;

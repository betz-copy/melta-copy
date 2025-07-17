import { Divider, Grid } from '@mui/material';
import i18next from 'i18next';
import React, { useState } from 'react';
import { useQueryClient } from 'react-query';
import { InfoTypography } from '../../../../common/InfoTypography';
import { FormikAutoComplete } from '../../../../common/inputs/FormikAutoComplete';
import { ViewModeTextField } from '../../../../common/inputs/ViewModeTextField';
import { StepComponentProps } from '../../../../common/wizards';
import { DashboardItemType, TableForm, ViewMode } from '../../../../interfaces/dashboard';
import { IEntityTemplateMap } from '../../../../interfaces/entityTemplates';
import { dashboardInitialValues, getTemplateProperties } from '../../../../utils/dashboard/formik';
import { ChangeTemplate } from '../../Dialogs';
import { IChildTemplateMap } from '../../../../interfaces/childTemplates';

const SideBarDetails: React.FC<StepComponentProps<TableForm> & { viewMode: ViewMode }> = ({ viewMode, ...formikProps }) => {
    const { values, errors, touched, handleChange, setFieldValue, setValues } = formikProps;

    const queryClient = useQueryClient();
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const childEntityTemplates = queryClient.getQueryData<IChildTemplateMap>('getChildEntityTemplates')!;

    const entityTemplatesIds = [...entityTemplates.keys(), ...childEntityTemplates.keys()];

    const [changeTemplateWarning, setChangeTemplateWarning] = useState<{ isOpen: boolean; newTemplate: string | string[] | null }>({
        isOpen: false,
        newTemplate: null,
    });

    const handleChangeTemplate = (newValue: string[] | string | null) => {
        const childTemplate = childEntityTemplates.get(newValue as string);

        setFieldValue('templateId', childTemplate?.parentTemplate._id || newValue || null);
        setFieldValue('childTemplateId', childTemplate?._id || null);

        if (typeof newValue === 'string')
            setFieldValue('columns', getTemplateProperties(childTemplate ? childEntityTemplates : entityTemplates, newValue));
    };

    return (
        <Grid container direction="column" spacing={4}>
            <Grid item>
                <FormikAutoComplete
                    formik={formikProps}
                    formikField={values.childTemplateId ? 'childTemplateId' : 'templateId'}
                    options={entityTemplatesIds}
                    label={i18next.t('entityTemplate')}
                    onChange={(newValue) => {
                        if (values.templateId) setChangeTemplateWarning({ isOpen: true, newTemplate: newValue });
                        else handleChangeTemplate(newValue);
                    }}
                    getOptionLabel={(id) => childEntityTemplates.get(id)?.displayName || entityTemplates.get(id)?.displayName || id}
                    multiple={false}
                    readonly={viewMode === ViewMode.ReadOnly}
                    style={{ width: '100%' }}
                />
            </Grid>

            {values.templateId && (
                <Grid item container direction="column" spacing={4}>
                    <Grid item>
                        <Divider />
                    </Grid>
                    <Grid item container direction="column" spacing={2.5}>
                        <Grid item>
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

                        <Grid item>
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

                    <Grid item container direction="column" spacing={2}>
                        <Grid item>
                            <InfoTypography text={i18next.t('dashboard.tables.permissionWarning')} />
                        </Grid>
                        <Grid item>
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

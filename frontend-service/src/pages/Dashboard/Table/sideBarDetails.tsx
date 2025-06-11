import { Divider, Grid } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import { IoIosArrowDown } from 'react-icons/io';
import { useQueryClient } from 'react-query';
import { InfoTypography } from '../../../common/InfoTypography';
import { FormikAutoComplete } from '../../../common/inputs/FormikAutoComplete';
import { StepComponentProps } from '../../../common/wizards';
import { TableMetaData, ViewMode } from '../../../interfaces/dashboard';
import { IEntityTemplateMap } from '../../../interfaces/entityTemplates';
import { getTemplateProperties } from '../../../utils/dashboard/formik';
import { ViewModeTextField } from '../../../common/inputs/ViewModeTextField';

const SideBarDetails: React.FC<StepComponentProps<TableMetaData> & { viewMode: ViewMode }> = ({ viewMode, ...formikProps }) => {
    const { values, errors, touched, handleChange, setFieldValue } = formikProps;

    const queryClient = useQueryClient();
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;

    return (
        <Grid container direction="column" spacing={4}>
            <Grid item>
                <FormikAutoComplete
                    formik={formikProps}
                    formikField="templateId"
                    options={Array.from(entityTemplates.keys())}
                    label={i18next.t('entity')}
                    onChange={(newValue) => {
                        setFieldValue('templateId', newValue || null);
                        setFieldValue('columns', getTemplateProperties(entityTemplates, newValue as string));
                    }}
                    getOptionLabel={(id) => entityTemplates.get(id)?.displayName || id}
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
        </Grid>
    );
};

export { SideBarDetails };

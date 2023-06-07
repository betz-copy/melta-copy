import React from 'react';
import i18next from 'i18next';
import { BlueTitle } from '../../../BlueTitle';
import { Box, Grid, Typography } from '@mui/material';
import { IMongoProcessTemplatePopulated } from '../../../../interfaces/processes/processTemplate';
import { FormikProps, FormikProvider } from 'formik';
import { SummaryDetailsValues } from '.';
import { JSONSchemaFormik } from '../../../inputs/JSONSchemaFormik';
import { filterAttachmentsProcessPropertiesFromSchema } from '../../../../utils/filterAttachmentsFromSchema';
import pickBy from 'lodash.pickby';
import { InstanceFileInput } from '../../../inputs/InstanceFilesInput/InstanceFileInput';
import { DownloadButton } from '../../../DownloadButton';

interface SummaryPropertiesProps {
    formik: FormikProps<SummaryDetailsValues>;
    template: IMongoProcessTemplatePopulated;
    isEditMode?: boolean;
}
const SummaryProperties: React.FC<SummaryPropertiesProps> = ({ formik, template, isEditMode = false }) => {
    const { values, errors, touched, setFieldValue, setFieldTouched } = formik;
    const { properties } = template.summaryDetails;
    const fileProperties = pickBy(properties.properties, (value) => value.format === 'fileId');
    const templateFileProperties = Object.keys(fileProperties).length ? fileProperties : null;
    return (
        <FormikProvider value={formik}>
            <BlueTitle
                title={i18next.t('wizard.processInstance.summary.moreInfo')}
                component={'h5'}
                variant={'h5'}
                style={{ fontWeight: 600, opacity: 0.9 }}
            />
            <Grid item sx={{ maxHeight: '500px', paddingRight: '15px', overflowY: 'auto' }}>
                <Box paddingTop={0.5} paddingLeft={1}>
                    <BlueTitle title={i18next.t('wizard.entityTemplate.properties')} component="h6" variant="h6" />
                    <JSONSchemaFormik
                        schema={filterAttachmentsProcessPropertiesFromSchema(template.summaryDetails)}
                        values={{ ...values, properties: values.summaryDetails }}
                        setValues={(propertiesValues) => setFieldValue('summaryDetails', propertiesValues)}
                        errors={errors.summaryDetails ?? {}}
                        touched={touched.summaryDetails ?? {}}
                        setFieldTouched={(field) => setFieldTouched(`details.${field}`)}
                        readonly={!isEditMode}
                    />
                </Box>
                {templateFileProperties && (
                    <Box>
                        <BlueTitle
                            title={i18next.t('wizard.entityTemplate.attachments')}
                            component="h6"
                            variant="h6"
                            style={{ marginBottom: '22px' }}
                        />

                        <>
                            {isEditMode ? (
                                <>
                                    {Object.entries(templateFileProperties).map(([key, value]) => (
                                        <InstanceFileInput
                                            key={key}
                                            fileFieldName={key}
                                            fieldTemplateTitle={value.title}
                                            setFieldValue={(field, value) => setFieldValue(`summaryAttachments.${field}`, value)}
                                            required={false}
                                            value={values.summaryAttachments[key]}
                                            error={errors.summaryAttachments?.[key] ? JSON.stringify(errors.summaryAttachments?.[key]) : undefined}
                                        />
                                    ))}
                                </>
                            ) : (
                                <>
                                    {Object.entries(templateFileProperties).map(([fieldName, { title }]) => (
                                        <Grid container spacing={1} alignItems="center" key={fieldName}>
                                            <Grid item>
                                                <Typography display="inline" variant="body1">
                                                    {title}:
                                                </Typography>
                                            </Grid>
                                            <Grid item>
                                                {values.summaryAttachments[fieldName] ? (
                                                    <DownloadButton fileId={values.summaryAttachments[fieldName].name} />
                                                ) : (
                                                    <Typography display="inline" variant="h6">
                                                        -
                                                    </Typography>
                                                )}
                                            </Grid>
                                        </Grid>
                                    ))}
                                </>
                            )}
                        </>
                    </Box>
                )}
            </Grid>
        </FormikProvider>
    );
};

export default SummaryProperties;

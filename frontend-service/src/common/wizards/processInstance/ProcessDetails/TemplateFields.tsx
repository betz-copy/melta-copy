import { Grid } from '@mui/material';
import i18next from 'i18next';
import { Field } from 'formik';
import { Dictionary } from 'lodash';
import React from 'react';
import { FileAttachments } from './FileAttachmentFields';
import { SchemaForm } from './SchemaForm';
import { BlueTitle } from '../../../BlueTitle';
import { pickProcessFieldsPropertiesSchema } from '../../../../utils/pickFieldsPropertiesSchema';
import { EntityReference } from '../EntityReference';
import { IProcessSingleProperty } from '../../../../interfaces/processes/processTemplate';

export const TemplateFields = ({
    toPrint,
    values,
    viewMode,
    errors,
    touched,
    setFieldValue,
    setFieldTouched,
    templateFileProperties,
    handleBlur,
    templateEntityReferenceProperties,
}) => {
    return (
        values.template && (
            <Grid container flexDirection="column" width="100%" height="100%" justifyContent="space-between" paddingLeft={!viewMode ? '20px' : 0}>
                <Grid
                    item
                    sx={{
                        overflowY: 'auto',
                        width: '100%',
                    }}
                >
                    {Object.keys(pickProcessFieldsPropertiesSchema(values.template?.details)?.properties).length !== 0 && (
                        <SchemaForm {...{ viewMode, values, errors, touched, setFieldValue, setFieldTouched, toPrint }} />
                    )}
                    {Object.keys(templateFileProperties!).length !== 0 && (
                        <FileAttachments
                            {...{
                                viewMode,
                                templateFileProperties,
                                values,
                                errors,
                                setFieldValue,
                                required: values.template.details.properties.required || [],
                                touched,
                                handleBlur,
                                setFieldTouched,
                                toPrint,
                            }}
                        />
                    )}
                    {Object.keys(templateEntityReferenceProperties!).length !== 0 && (
                        <Grid padding={1}>
                            <BlueTitle
                                title={i18next.t('wizard.processInstance.refEntities')}
                                component="h6"
                                variant="h6"
                                style={{ marginBottom: '22px' }}
                            />
                            {Object.entries((templateEntityReferenceProperties as Dictionary<IProcessSingleProperty>)!).map(
                                ([fieldName, { title }]) => (
                                    <Field
                                        key={fieldName}
                                        validate={(changedValue) => {
                                            return (
                                                values.template?.details.properties.required.includes(fieldName) &&
                                                !changedValue?.entity &&
                                                i18next.t('validation.requiredEntity')
                                            );
                                        }}
                                        name={`entityReferences.${fieldName}`}
                                        component={EntityReference}
                                        errorText={
                                            errors.entityReferences?.[fieldName] && touched.entityReferences?.[fieldName]
                                                ? JSON.stringify(errors.entityReferences?.[fieldName])
                                                : undefined
                                        }
                                        field={fieldName || ''}
                                        values={values}
                                        errors={errors}
                                        touched={touched}
                                        setFieldValue={setFieldValue}
                                        handleBlur={handleBlur}
                                        isViewMode={viewMode}
                                        title={title}
                                    />
                                ),
                            )}
                        </Grid>
                    )}
                </Grid>
            </Grid>
        )
    );
};

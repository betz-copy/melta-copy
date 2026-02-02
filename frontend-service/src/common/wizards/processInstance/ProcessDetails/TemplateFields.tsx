import { Grid } from '@mui/material';
import { Field } from 'formik';
import i18next from 'i18next';
import { Dictionary } from 'lodash';
import { IProcessSingleProperty } from '../../../../interfaces/processes/processTemplate';
import { pickProcessFieldsPropertiesSchema } from '../../../../utils/pickFieldsPropertiesSchema';
import BlueTitle from '../../../MeltaDesigns/BlueTitle';
import { EntityReferenceField } from '../EntityReferenceField';
import { FileAttachments } from './FileAttachmentFields';
import { SchemaForm } from './SchemaForm';

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
                    {Object.keys(templateEntityReferenceProperties!).length > 0 && (
                        <Grid padding={1}>
                            <BlueTitle
                                title={i18next.t('wizard.processInstance.refEntities')}
                                component="h6"
                                variant="h6"
                                style={{ marginBottom: '22px', fontSize: '16px' }}
                            />
                            {Object.entries((templateEntityReferenceProperties as Dictionary<IProcessSingleProperty>)!).map(
                                ([fieldName, { title }]) => (
                                    <Field
                                        name={`entityReferences.${fieldName}`}
                                        component={EntityReferenceField}
                                        key={fieldName}
                                        field={fieldName}
                                        values={values}
                                        errors={errors}
                                        touched={touched}
                                        setFieldValue={setFieldValue}
                                        handleBlur={handleBlur}
                                        isViewMode={viewMode}
                                        title={title}
                                        errorText={
                                            errors.entityReferences?.[fieldName] && touched.entityReferences?.[fieldName]
                                                ? JSON.stringify(errors.entityReferences?.[fieldName])
                                                : null
                                        }
                                        displaySmallField={viewMode}
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

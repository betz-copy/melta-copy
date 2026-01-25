import { Grid } from '@mui/material';
import { IProcessSingleProperty } from '@packages/process';
import i18next from 'i18next';
import { Dictionary } from 'lodash';
import { pickProcessFieldsPropertiesSchema } from '../../../../utils/pickFieldsPropertiesSchema';
import BlueTitle from '../../../MeltaDesigns/BlueTitle';
import { FileAttachments } from './FileAttachmentFields';
import OpenEntityReference from './OpenEntityReference';
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
                <Grid sx={{ overflowY: 'auto', width: '100%' }}>
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
                                    <OpenEntityReference
                                        key={fieldName}
                                        errors={errors}
                                        fieldName={fieldName}
                                        handleBlur={handleBlur}
                                        setFieldValue={setFieldTouched}
                                        title={title}
                                        touched={touched}
                                        values={values}
                                        viewMode={viewMode}
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

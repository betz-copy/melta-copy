import React from 'react';
import * as Yup from 'yup';
import i18next from 'i18next';
import pickBy from 'lodash.pickby';
import { Grid } from '@mui/material';
import { EntityWizardValues } from './index';
import { StepComponentProps } from '../index';
import { InstanceFileInput } from '../../inputs/InstanceFilesInput/InstanceFileInput';

const fileFieldsSchema = Yup.object({
    attachmentsProperties: Yup.object().required(i18next.t('validation.required')),
});
const FileFields: React.FC<StepComponentProps<EntityWizardValues>> = ({ values, setFieldValue, errors, setFieldTouched }) => {
    const filesProperties = pickBy(values.template.properties.properties, (value) => value.format === 'fileId');
    const requiredFilesNames = values.template.properties.required.filter((name) => Object.keys(filesProperties).includes(name));
    return (
        <Grid container flexDirection="column" rowGap="20px">
            {Object.entries(filesProperties).map(([key, value]) => (
                <InstanceFileInput
                    key={key}
                    fileFieldName={`attachmentsProperties.${key}`}
                    fieldTemplateTitle={value.title}
                    setFieldValue={setFieldValue}
                    required={requiredFilesNames.includes(key)}
                    value={values.attachmentsProperties[key]}
                    error={errors.attachmentsProperties?.[key]}
                    setFieldTouched={setFieldTouched}
                />
            ))}
        </Grid>
    );
};

export { FileFields, fileFieldsSchema };

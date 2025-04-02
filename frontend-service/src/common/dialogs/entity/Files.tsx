import { Grid } from '@mui/material';
import React from 'react';
import { InstanceFileInput } from '../../inputs/InstanceFilesInput/InstanceFileInput';
import { InstanceSingleFileInput } from '../../inputs/InstanceFilesInput/InstanceSingleFileInput';

const Files: React.FC<{ key; propIndex; items; title; value; setFieldValue; required; error; setFieldTouched; setExternalErrors }> = ({
    key,
    propIndex,
    items,
    title,
    value,
    setFieldValue,
    required,
    error,
    setFieldTouched,
    setExternalErrors,
}) => {
    return (
        <Grid item key={key} marginTop={propIndex > 0 ? 2 : 0}>
            {items ? (
                <InstanceFileInput
                    key={key}
                    fileFieldName={`attachmentsProperties.${key}`}
                    fieldTemplateTitle={title}
                    setFieldValue={setFieldValue}
                    required={required}
                    value={value}
                    error={error}
                    setFieldTouched={setFieldTouched}
                    setExternalErrors={setExternalErrors}
                />
            ) : (
                <InstanceSingleFileInput
                    key={key}
                    fileFieldName={`attachmentsProperties.${key}`}
                    fieldTemplateTitle={title}
                    setFieldValue={setFieldValue}
                    required={required}
                    value={value}
                    error={error}
                    setFieldTouched={setFieldTouched}
                    setExternalErrors={setExternalErrors}
                />
            )}
        </Grid>
    );
};

export default Files;

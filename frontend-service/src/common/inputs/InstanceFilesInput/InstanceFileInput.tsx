import React from 'react';
import i18next from 'i18next';
import { Box } from '@mui/material';
import { Field, FormikProps } from 'formik';
import FileInput from '../FileInput';
import { ProcessStepValues } from '../../wizards/processInstance/ProcessSteps';
import { ProcessDetailsValues } from '../../wizards/processInstance/ProcessDetails';

type ProcessFormikProps = ProcessStepValues | ProcessDetailsValues;

interface InstanceFileInputProps {
    fileFieldName: string;
    fieldTemplateTitle: string;
    setFieldValue: (field: string, value: File[]) => void; // Update to accept an array of files
    required: Boolean;
    value: File[] | undefined; // Update to accept an array of files
    error: string | undefined;
    setFieldTouched: FormikProps<ProcessFormikProps>['setFieldTouched'];
}

export const InstanceFileInput: React.FC<InstanceFileInputProps> = ({
    fileFieldName,
    fieldTemplateTitle,
    setFieldValue,
    required,
    value,
    error,
    setFieldTouched,
}) => {
    return (
        <Box
            marginTop={1}
            marginBottom={1}
            paddingTop={0.5}
            paddingLeft={1}
            sx={{
                height: '70px',
                width: '100%',
            }}
        >
            <Field
                validate={(changedValue) => {
                    return required && (!changedValue || changedValue.length === 0) && i18next.t('validation.requiredFile');
                }}
                name={fileFieldName}
                component={FileInput}
                fileFieldName={fileFieldName}
                inputText={`${fieldTemplateTitle} ${required ? '*' : ''}`}
                files={value || []}
                onDropFiles={(acceptedFiles) => {
                    console.log(acceptedFiles, value)
                    console.log(fileFieldName, acceptedFiles)
                    setFieldValue(fileFieldName, acceptedFiles);
                    setFieldTouched(fileFieldName, true, false);
                }}
                onDeleteFile={(fileIndex) => {
                    const updatedFiles = [...(value || [])];
                    updatedFiles.splice(fileIndex, 1);
                    setFieldValue(fileFieldName, updatedFiles);
                    setFieldTouched(fileFieldName, true, false);
                }}
                errorText={error}
            />
        </Box>
    );
};

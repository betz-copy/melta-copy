import React, { useState } from 'react';
import i18next from 'i18next';
import { Box } from '@mui/material';
import { Field, FormikProps } from 'formik';
import FileInput from '../FileInput';
import { ProcessStepValues } from '../../wizards/processInstance/ProcessSteps';
import { ProcessDetailsValues } from '../../wizards/processInstance/ProcessDetails';
import { getFileName } from '../../../utils/getFileName';

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
    const [filesName, setFilesName] = useState<string[]>(value ? value.map(file => getFileName(file.name)) : []);
        
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
                name={filesName}
                component={FileInput}
                fileFieldName={fileFieldName}
                inputText={`${fieldTemplateTitle} ${required ? '*' : ''}`}
                files={filesName || []}
                onDropFiles={(acceptedFiles) => {
                    setFieldValue(fileFieldName, acceptedFiles);
                    setFilesName(acceptedFiles.map((file) => file.name))
                    setFieldTouched(fileFieldName, true, false);
                }}
                onDeleteFile={(fileIndex) => {
                    const updatedFiles = [...(value || [])];
                    updatedFiles.splice(fileIndex, 1);
                    // setFileName
                    setFieldValue(fileFieldName, updatedFiles);
                    setFieldTouched(fileFieldName, true, false);
                }}
                errorText={error}
            />
        </Box>
    );
};

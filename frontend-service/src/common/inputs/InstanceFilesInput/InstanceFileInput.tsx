import React, { useState } from 'react';
import i18next from 'i18next';
import { Box } from '@mui/material';
import { Field } from 'formik';
import FileInput from '../FileInput';
import { getFileName } from '../../../utils/getFileName';

interface InstanceFileInputProps {
    fileFieldName: string;
    fieldTemplateTitle: string;
    setFieldValue: (field: string, value: File | undefined) => void;
    required: Boolean;
    value: File | undefined;
    error: string | undefined;
}

export const InstanceFileInput: React.FC<InstanceFileInputProps> = ({ fileFieldName, fieldTemplateTitle, setFieldValue, required, value, error }) => {
    const fileId = value?.name;
    const initialFileName = fileId && !(value instanceof File) ? getFileName(fileId) : fileId;
    const [fileName, setFileName] = useState<string | undefined>(initialFileName);

    return (
        <Box marginTop={1} marginBottom={1} paddingTop={0.5} paddingLeft={1}>
            <Field
                validate={(changedValue) => required && !changedValue && i18next.t('validation.requiredFile')}
                name={fileFieldName}
                component={FileInput}
                inputText={`${fieldTemplateTitle} ${required ? '*' : ''}`}
                fileName={fileName}
                onDropFile={(acceptedFile) => {
                    setFieldValue(fileFieldName, acceptedFile);
                    setFileName(acceptedFile.name);
                }}
                onDeleteFile={() => {
                    setFieldValue(fileFieldName, undefined);
                    setFileName(undefined);
                }}
                errorText={error}
            />
        </Box>
    );
};

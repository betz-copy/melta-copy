import React, { useState } from 'react';
import i18next from 'i18next';
import { Box } from '@mui/material';
import { Field, FormikProps } from 'formik';
import FileInput from '../FileInput';
import { getFileName } from '../../../utils/getFileName';
import { ProcessStepValues } from '../../wizards/processInstance/ProcessSteps';
import { ProcessDetailsValues } from '../../wizards/processInstance/ProcessDetails';

type ProcessFormikProps = ProcessStepValues | ProcessDetailsValues;

interface InstanceFileInputProps {
    fileFieldName: string;
    fieldTemplateTitle: string;
    setFieldValue: (field: string, value: File | null) => void;
    required: Boolean;
    value: File | undefined;
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
    const fileId = value?.name;
    const initialFileName = fileId && !(value instanceof File) ? getFileName(fileId) : fileId;
    const [fileName, setFileName] = useState<string | undefined>(initialFileName);

    return (
        <Box
            marginTop={1}
            marginBottom={1}
            paddingTop={0.5}
            paddingLeft={1}
            sx={{
                height: '40px',
            }}
        >
            <Field
                validate={(changedValue) => {
                    return required && !changedValue && i18next.t('validation.requiredFile');
                }}
                name={fileFieldName}
                component={FileInput}
                fileFieldName={fileFieldName}
                inputText={`${fieldTemplateTitle} ${required ? '*' : ''}`}
                fileName={fileName}
                onDropFile={(acceptedFile) => {
                    setFileName(acceptedFile.name);
                    setFieldValue(fileFieldName, acceptedFile);
                    setFieldTouched(fileFieldName, true, false);
                }}
                onDeleteFile={() => {
                    setFileName(undefined);
                    setFieldValue(fileFieldName, null);
                    setFieldTouched(fileFieldName, true, false);
                }}
                errorText={error}
            />
        </Box>
    );
};

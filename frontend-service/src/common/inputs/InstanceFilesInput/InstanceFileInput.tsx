import { Box } from '@mui/material';
import { Field, FormikProps } from 'formik';
import i18next from 'i18next';
import React from 'react';
import { Accept } from 'react-dropzone';
import { toast } from 'react-toastify';
import { ProcessDetailsValues } from '../../wizards/processInstance/ProcessDetails';
import { ProcessStepValues } from '../../wizards/processInstance/ProcessSteps';
import FilesInput from '../FilesInput';

type ProcessFormikProps = ProcessStepValues | ProcessDetailsValues;

interface InstanceFileInputProps {
    fileFieldName: string;
    fieldTemplateTitle: string;
    acceptedFilesTypes?: Accept;
    setFieldValue: (field: string, value: File[]) => void;
    required: boolean;
    value: File[] | undefined;
    error: string | undefined;
    setErrorText?: React.Dispatch<React.SetStateAction<string | undefined>>;
    setFieldTouched: FormikProps<ProcessFormikProps>['setFieldTouched'];
    setExternalErrors?: React.Dispatch<
        React.SetStateAction<{
            files: boolean;
            unique: {};
            action: string;
        }>
    >;
    onDrop?: (files: File[]) => Promise<void>;
    isLoading?: boolean;
    comment?: string;
    limit?: number;
}

export const InstanceFileInput: React.FC<InstanceFileInputProps> = ({
    fileFieldName,
    fieldTemplateTitle,
    acceptedFilesTypes,
    setFieldValue,
    required,
    value,
    error,
    setErrorText,
    setFieldTouched,
    setExternalErrors,
    onDrop,
    isLoading,
    comment,
    limit,
}) => {
    return (
        <Box marginTop={1} marginBottom={1} paddingTop={0.5} paddingLeft={1} width="100%">
            <Field
                validate={(changedValue) => {
                    return required && (!changedValue || changedValue.length === 0) && i18next.t('validation.requiredFiles');
                }}
                name={fileFieldName}
                component={FilesInput}
                fileFieldName={fileFieldName}
                inputText={`${fieldTemplateTitle} ${required ? '*' : ''}`}
                files={value ?? []}
                onDropFiles={(acceptedFiles: File[]) => {
                    const updatedFiles = value ? [...value, ...acceptedFiles] : acceptedFiles;
                    if (limit && updatedFiles.length > limit) toast.warn(i18next.t('validation.fileslimit', { limit }));
                    else {
                        setFieldValue(fileFieldName, updatedFiles);
                        setFieldTouched(fileFieldName, true, false);
                        setExternalErrors?.((prev) => ({ ...prev, files: false }));
                        onDrop?.(acceptedFiles);
                    }
                }}
                onDeleteFile={(fileIndex: number, event: React.MouseEvent<HTMLButtonElement>) => {
                    event.stopPropagation();
                    const updatedFiles = [...(value || [])];
                    updatedFiles.splice(fileIndex, 1);
                    setFieldValue(fileFieldName, updatedFiles);
                    setFieldTouched(fileFieldName, true, false);
                    setExternalErrors?.((prev) => ({ ...prev, files: false }));
                }}
                errorText={error}
                acceptedFilesTypes={acceptedFilesTypes}
                isLoading={isLoading}
                setErrorText={setErrorText}
                comment={comment}
                multiple
            />
        </Box>
    );
};

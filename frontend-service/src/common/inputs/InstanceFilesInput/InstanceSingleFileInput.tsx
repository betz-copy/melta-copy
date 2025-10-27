import { Box } from '@mui/material';
import { Field, FormikProps } from 'formik';
import i18next from 'i18next';
import React from 'react';
import { Accept } from 'react-dropzone';
import { ProcessDetailsValues } from '../../wizards/processInstance/ProcessDetails';
import { ProcessStepValues } from '../../wizards/processInstance/ProcessSteps';
import FileInput from '../ImageFileInput';

type ProcessFormikProps = ProcessStepValues | ProcessDetailsValues;

interface InstanceFileInputProps {
    fileFieldName: string;
    fieldTemplateTitle: string;
    setFieldValue: (field: string, value: File | undefined) => void;
    required: boolean;
    value: File | undefined;
    error: string | undefined;
    acceptedFilesTypes?: Accept;
    setFieldTouched: FormikProps<ProcessFormikProps>['setFieldTouched'];
    setExternalErrors?: React.Dispatch<
        React.SetStateAction<{
            files: boolean;
            unique: {};
            action: string;
        }>
    >;
    onDrop?: (file: File) => Promise<void>;
    isLoading?: boolean;
    disableCamera?: boolean;
    comment?: string;
}

export const InstanceSingleFileInput: React.FC<InstanceFileInputProps> = ({
    fileFieldName,
    fieldTemplateTitle,
    setFieldValue,
    required,
    value,
    error,
    setFieldTouched,
    setExternalErrors,
    acceptedFilesTypes,
    onDrop,
    isLoading,
    disableCamera,
    comment,
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
                    return required && !changedValue && i18next.t('validation.requiredFile');
                }}
                name={fileFieldName}
                component={FileInput}
                fileFieldName={fileFieldName}
                inputText={`${fieldTemplateTitle} ${required ? '*' : ''}`}
                file={value}
                onDropFile={(acceptedFile) => {
                    if (onDrop) onDrop(acceptedFile);
                    setFieldValue(fileFieldName, acceptedFile);
                    setFieldTouched(fileFieldName, true, false);
                    setExternalErrors?.((prev) => ({ ...prev, files: false }));
                }}
                onDeleteFile={(event: React.MouseEvent<HTMLButtonElement>) => {
                    event.stopPropagation();
                    setFieldValue(fileFieldName, undefined);
                    setFieldTouched(fileFieldName, true, false);
                    setExternalErrors?.((prev) => ({ ...prev, files: false }));
                }}
                acceptedFilesTypes={acceptedFilesTypes}
                errorText={error}
                isLoading={isLoading}
                disableCamera={disableCamera}
                comment={comment}
                scanFromImage
            />
        </Box>
    );
};

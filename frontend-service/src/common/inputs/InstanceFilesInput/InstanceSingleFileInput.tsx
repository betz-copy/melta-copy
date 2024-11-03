import React from 'react';
import i18next from 'i18next';
import { Box } from '@mui/material';
import { Field, FormikProps } from 'formik';
import { ProcessStepValues } from '../../wizards/processInstance/ProcessSteps';
import { ProcessDetailsValues } from '../../wizards/processInstance/ProcessDetails';
import FileInput from '../ImageFileInput';

type ProcessFormikProps = ProcessStepValues | ProcessDetailsValues;

interface InstanceFileInputProps {
    fileFieldName: string;
    fieldTemplateTitle: string;
    setFieldValue: (field: string, value: File | undefined) => void;
    required: Boolean;
    value: File | undefined;
    error: string | undefined;
    setFieldTouched?: FormikProps<ProcessFormikProps>['setFieldTouched'];
    setExternalErrors?: React.Dispatch<
        React.SetStateAction<{
            files: boolean;
            unique: {};
            action: string;
        }>
    >;
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
                    setFieldValue(fileFieldName, acceptedFile);
                    if (setFieldTouched) setFieldTouched(fileFieldName, true, false);
                    setExternalErrors?.((prev) => ({ ...prev, files: false }));
                }}
                onDeleteFile={(event: React.MouseEvent<HTMLButtonElement>) => {
                    event.stopPropagation();
                    setFieldValue(fileFieldName, undefined);
                    if (setFieldTouched) setFieldTouched(fileFieldName, true, false);
                    setExternalErrors?.((prev) => ({ ...prev, files: false }));
                }}
                errorText={error}
            />
        </Box>
    );
};

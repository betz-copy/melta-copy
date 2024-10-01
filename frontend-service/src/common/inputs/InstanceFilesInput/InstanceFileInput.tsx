import React from 'react';
import i18next from 'i18next';
import { Box } from '@mui/material';
import { Field, FormikProps } from 'formik';
import FilesInput from '../FilesInput';
import { ProcessStepValues } from '../../wizards/processInstance/ProcessSteps';
import { ProcessDetailsValues } from '../../wizards/processInstance/ProcessDetails';
import { getFileName } from '../../../utils/getFileName';

type ProcessFormikProps = ProcessStepValues | ProcessDetailsValues;

interface InstanceFileInputProps {
    fileFieldName: string;
    fieldTemplateTitle: string;
    setFieldValue: (field: string, value: File[]) => void;
    required: Boolean;
    value: File[] | undefined;
    error: string | undefined;
    setFieldTouched: FormikProps<ProcessFormikProps>['setFieldTouched'];
    setExternalErrors?: React.Dispatch<
        React.SetStateAction<{
            files: boolean;
            unique: {};
            action: string;
        }>
    >;
}

export const InstanceFileInput: React.FC<InstanceFileInputProps> = ({
    fileFieldName,
    fieldTemplateTitle,
    setFieldValue,
    required,
    value,
    error,
    setFieldTouched,
    setExternalErrors,
}) => {
    const filesName = value
        ? value.map((file) => {
              const fileId = file.name;
              return !(file instanceof File) ? getFileName(fileId) : fileId;
          })
        : [];

    return (
        <Box
            marginTop={1}
            marginBottom={1}
            paddingTop={0.5}
            paddingLeft={1}
            sx={{
                width: '100%',
            }}
        >
            <Field
                validate={(changedValue) => {
                    return required && (!changedValue || changedValue.length === 0) && i18next.t('validation.requiredFiles');
                }}
                name={fileFieldName}
                component={FilesInput}
                fileFieldName={fileFieldName}
                inputText={`${fieldTemplateTitle} ${required ? '*' : ''}`}
                files={filesName || []}
                onDropFiles={(acceptedFiles: File[]) => {
                    const updatedFiles = value ? [...value, ...acceptedFiles] : acceptedFiles;
                    setFieldValue(fileFieldName, updatedFiles);
                    setFieldTouched(fileFieldName, true, false);
                    setExternalErrors?.((prev) => ({ ...prev, files: false }));
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
                multiple
            />
        </Box>
    );
};

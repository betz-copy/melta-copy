import React, { useEffect, useState } from 'react';
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
    const [filesName, setFilesName] = useState<string[]>(value ? value.map((file) => getFileName(file.name)) : []);
    const [sizeError, setSizeError] = useState<boolean | undefined>(false);

    let sum = 0;

    useEffect(() => {
        if (value) {
            value.forEach((file) => {
                sum += file.size;
            });

            if (sum > 9000000000) {
                setSizeError(true);
            } else {
                setSizeError(false);
            }
        }
    }, [value]);

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
                    // changedValue.forEach((file) => {
                    //     sum += file.size;
                    // });
                    return (
                        required && (!changedValue || changedValue.length === 0) && i18next.t('validation.requiredFiles')
                        // ||
                        // (sum > 9000000000 && i18next.t('validation.filesSizesTooBig'))
                    );
                }}
                name={fileFieldName}
                component={FilesInput}
                fileFieldName={fileFieldName}
                inputText={`${fieldTemplateTitle} ${required ? '*' : ''}`}
                files={filesName || []}
                onDropFiles={(acceptedFiles: File[]) => {
                    const updatedFiles = value ? [...value, ...acceptedFiles] : acceptedFiles;
                    setFieldValue(fileFieldName, updatedFiles);
                    setFilesName([...filesName, ...acceptedFiles.map((file) => file.name)]);
                    setFieldTouched(fileFieldName, true, false);
                }}
                onDeleteFile={(fileIndex: number, event: React.MouseEvent<HTMLButtonElement>) => {
                    event.stopPropagation();
                    const updatedFiles = [...(value || [])];
                    updatedFiles.splice(fileIndex, 1);
                    setFieldValue(fileFieldName, updatedFiles);
                    setFilesName(updatedFiles.map((file: File | { name: string }) => (file instanceof File ? file.name : getFileName(file.name))));
                    setFieldTouched(fileFieldName, true, false);
                }}
                errorText={error || sizeError ? i18next.t('validation.filesSizesTooBig') : undefined}
                multiple
            />
        </Box>
    );
};

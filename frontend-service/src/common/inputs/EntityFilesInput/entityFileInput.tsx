import React, { useState } from 'react';
import i18next from 'i18next';
import { Box } from '@mui/material';
import { Field } from 'formik';
import FileInput from '../FileInput';
import { IEntitySingleProperty } from '../../../interfaces/entityTemplates';
import { getFileName } from '../../../utils/getFileName';

interface EntityFileInputProps {
    fieldName: string;
    value: IEntitySingleProperty;
    setFieldValue: (field: string, value: File | undefined) => void;
    required: Boolean;
    values: any;
    errors: any;
}

export const EntityFileInput: React.FC<EntityFileInputProps> = ({ fieldName, value, setFieldValue, required, values, errors }) => {
    const [fileName, setFileName] = useState<string | undefined>();

    const field = `attachmentsProperties.${fieldName}`;

    const getThisFileName = () => {
        if (fileName) return fileName;

        const fileId = values.attachmentsProperties[fieldName]?.name;
        if (!fileId) return '';

        const newFileName = getFileName(fileId);
        setFileName(newFileName);

        return newFileName;
    };

    return (
        <Box margin={1}>
            <Field
                validate={(changedValue) => required && !changedValue && i18next.t('validation.requiredFile')}
                name={field}
                component={FileInput}
                inputText={`${value.title} ${required ? '*' : ''}`}
                fileName={getThisFileName()}
                onDropFile={(acceptedFile) => {
                    setFieldValue(field, acceptedFile);
                    setFileName(acceptedFile.name);
                }}
                onDeleteFile={() => {
                    setFieldValue(field, undefined);
                    setFileName(undefined);
                }}
                errorText={errors.attachmentsProperties ? errors.attachmentsProperties[fieldName] : undefined}
            />
        </Box>
    );
};

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
    const fileId = values.attachmentsProperties[fieldName]?.name;
    const initialFileName = fileId ? getFileName(fileId) : undefined;

    const [fileName, setFileName] = useState<string | undefined>(initialFileName);

    const field = `attachmentsProperties.${fieldName}`;

    return (
        <Box margin={1}>
            <Field
                validate={(changedValue) => required && !changedValue && i18next.t('validation.requiredFile')}
                name={field}
                component={FileInput}
                inputText={`${value.title} ${required ? '*' : ''}`}
                fileName={fileName}
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

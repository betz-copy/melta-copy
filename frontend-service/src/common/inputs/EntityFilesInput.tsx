import React from 'react';
import i18next from 'i18next';
import { Box } from '@mui/material';
import { Field } from 'formik';
import FileInput from './FileInput';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';

export const EntityFilesInput: React.FC<{
    setFieldValue: (field: string, value: File | null) => void;
    requiredFilesNames: any;
    errors: any;
    values: any;
    filesProperties: IMongoEntityTemplatePopulated['properties']['properties'];
}> = ({ filesProperties, setFieldValue, requiredFilesNames, errors, values }) => {
    return (
        <>
            {Object.entries(filesProperties).map(([key, value]) => (
                <Box margin={1} key={key}>
                    <Field
                        validate={(changedValue) => requiredFilesNames.includes(key) && !changedValue && i18next.t('validation.requiredFile')}
                        name={`attachmentsProperties.${key}`}
                        component={FileInput}
                        inputText={`${value.title} ${requiredFilesNames.includes(key) ? '*' : ''}`}
                        filePath={values.attachmentsProperties[key]?.name}
                        onDropFile={(acceptedFile) => {
                            setFieldValue(`attachmentsProperties.${key}`, acceptedFile);
                        }}
                        onDeleteFile={() => {
                            setFieldValue(`attachmentsProperties.${key}`, null);
                        }}
                        errorText={errors.attachmentsProperties ? errors.attachmentsProperties[key] : undefined}
                    />
                </Box>
            ))}
        </>
    );
};

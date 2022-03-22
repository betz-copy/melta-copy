import React from 'react';
import { TextField, Box } from '@mui/material';
import * as Yup from 'yup';
import i18next from 'i18next';
import FileInput from '../../inputs/FileInput';

import { EntityTemplateWizardValues } from './index';
import { StepComponentProps } from '../index';

const createTemplateNameSchema = {
    name: Yup.string().required(i18next.t('validation.required')),
    displayName: Yup.string().required(i18next.t('validation.required')),
};

const CreateTemplateName: React.FC<StepComponentProps<EntityTemplateWizardValues>> = ({ values, touched, errors, handleChange, setFieldValue }) => {
    return (
        <>
            <Box margin={1}>
                <TextField
                    name="name"
                    label={i18next.t('wizard.name')}
                    value={values.name}
                    onChange={handleChange}
                    error={touched.name && Boolean(errors.name)}
                    helperText={touched.name && errors.name}
                />
            </Box>
            <Box margin={1}>
                <TextField
                    name="displayName"
                    label={i18next.t('wizard.displayName')}
                    value={values.displayName}
                    onChange={handleChange}
                    error={touched.displayName && Boolean(errors.displayName)}
                    helperText={touched.displayName && errors.displayName}
                />
            </Box>
            <Box margin={1}>
                <FileInput
                    onDeleteFile={() => {
                        setFieldValue('file', null);
                    }}
                    onDropFile={(acceptedFiles) => {
                        setFieldValue('file', acceptedFiles[0]);
                    }}
                    filePath={values.file?.name}
                    multipleFiles={false}
                    inputText={i18next.t('wizard.file')}
                    acceptedFilesTypes="image/png"
                />
            </Box>
        </>
    );
};

export { CreateTemplateName, createTemplateNameSchema };

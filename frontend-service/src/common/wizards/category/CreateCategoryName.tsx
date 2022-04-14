import React from 'react';
import { TextField, Box } from '@mui/material';
import * as Yup from 'yup';
import i18next from 'i18next';
import FileInput from '../../inputs/FileInput';
import { CategoryWizardValues } from './index';
import { StepComponentProps } from '../index';
import ColorPicker from '../../inputs/ColorPicker';
import { hebrewValidation, englishValidation } from '../../../utils/validation';

const createCategoryNameSchema = {
    name: Yup.string().matches(englishValidation, i18next.t('validation.english')).required(i18next.t('validation.required')),
    displayName: Yup.string().matches(hebrewValidation, i18next.t('validation.hebrew')).required(i18next.t('validation.required')),
};
const CreateCategoryName: React.FC<StepComponentProps<CategoryWizardValues>> = ({ values, touched, errors, handleChange, setFieldValue }) => {
    const colors = ['#B80000', '#E65100', '#FCDC00', '#F78DA7', '#7B1FA2', '#0D47A1', '#B3E5FC', '#C8E6C9', '#33691E', '#607D8B'];

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
            <Box margin={1}>
                <ColorPicker
                    colors={colors}
                    color={values.color}
                    setColor={(value) => setFieldValue('color', value)}
                    text={i18next.t('wizard.color')}
                />
            </Box>
        </>
    );
};

export { CreateCategoryName, createCategoryNameSchema };

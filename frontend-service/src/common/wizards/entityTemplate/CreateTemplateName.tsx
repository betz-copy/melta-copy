import React from 'react';
import { TextField, Box } from '@mui/material';
import { FormikProps } from 'formik';
import * as Yup from 'yup';

import { EntityTemplateWizardValues } from './index';

const createTemplateNameSchema = {
    name: Yup.string().required('חובה'),
    displayName: Yup.string().required('חובה'),
};

const CreateTemplateName: React.FC<FormikProps<EntityTemplateWizardValues>> = ({ values, touched, errors, handleChange }) => {
    return (
        <>
            <Box margin={1}>
                <TextField
                    name="name"
                    label="name"
                    value={values.name}
                    onChange={handleChange}
                    error={touched.name && Boolean(errors.name)}
                    helperText={touched.name && errors.name}
                />
            </Box>
            <Box margin={1}>
                <TextField
                    name="displayName"
                    label="displayName"
                    value={values.displayName}
                    onChange={handleChange}
                    error={touched.displayName && Boolean(errors.displayName)}
                    helperText={touched.displayName && errors.displayName}
                />
            </Box>
        </>
    );
};

export { CreateTemplateName, createTemplateNameSchema };

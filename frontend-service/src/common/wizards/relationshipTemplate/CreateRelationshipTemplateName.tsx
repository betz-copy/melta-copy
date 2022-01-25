import React from 'react';
import { TextField, Box } from '@mui/material';
import * as Yup from 'yup';

import { RelationshipTemplateWizardValues } from './index';
import { StepComponentProps } from '../index';

const createRelationshipTemplateNameSchema = {
    name: Yup.string().required('חובה'),
};

const CreateRelationshipTemplateName: React.FC<StepComponentProps<RelationshipTemplateWizardValues>> = ({
    values,
    touched,
    errors,
    handleChange,
}) => {
    return (
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
    );
};

export { CreateRelationshipTemplateName, createRelationshipTemplateNameSchema };

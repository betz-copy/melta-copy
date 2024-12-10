import { Autocomplete, Box, TextField } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import { useQueryClient } from 'react-query';
import * as Yup from 'yup';
import { chartWizardValues } from '.';
import { StepComponentProps } from '..';
import { IEntityTemplateMap } from '../../../interfaces/entityTemplates';

export const CreateChartDetailsSchema = {
    name: Yup.string().min(2, i18next.t('validation.variableName')).required(i18next.t('validation.required')),
    entityTemplate: Yup.object({
        _id: Yup.string().required(i18next.t('validation.required')),
        displayName: Yup.string().required(i18next.t('validation.required')),
    }).required(i18next.t('validation.required')),
};

const CreateChartDetails: React.FC<StepComponentProps<chartWizardValues>> = ({ values, touched, errors, handleChange, setFieldValue }) => {
    const queryClient = useQueryClient();

    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates');
    const entityTemplatesArray = Array.from(entityTemplates!.values());

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
                <Autocomplete
                    id="entityTemplate"
                    options={entityTemplatesArray}
                    onChange={(_e, value) => setFieldValue('entityTemplate', value || '')}
                    value={values.entityTemplate}
                    getOptionLabel={(option) => option.displayName}
                    renderInput={(params) => (
                        <TextField
                            style={{ width: '220px' }}
                            {...params}
                            error={Boolean(touched.entityTemplate && errors.entityTemplate)}
                            fullWidth
                            helperText={touched.entityTemplate && errors.entityTemplate}
                            name="entityTemplate"
                            variant="outlined"
                            label={i18next.t('wizard.relationshipTemplate.sourceEntity')}
                        />
                    )}
                />
            </Box>
        </>
    );
};
export { CreateChartDetails };

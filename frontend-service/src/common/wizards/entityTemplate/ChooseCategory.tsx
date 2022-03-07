import React from 'react';
import { TextField, Autocomplete } from '@mui/material';
import * as Yup from 'yup';
import i18next from 'i18next';
import { useQueryClient } from 'react-query';
import { EntityTemplateWizardValues } from './index';
import { StepComponentProps } from '../index';
import { IMongoCategory } from '../../../interfaces/categories';

const chooseCategorySchema = {
    category: Yup.object({
        _id: Yup.string().required(i18next.t('validation.required')),
        name: Yup.string().required(i18next.t('validation.required')),
        displayName: Yup.string().required(i18next.t('validation.required')),
    }).required(i18next.t('validation.required')),
};

const ChooseCategory: React.FC<StepComponentProps<EntityTemplateWizardValues>> = ({ values, touched, errors, setFieldValue }) => {
    const queryClient = useQueryClient();

    const categories = queryClient.getQueryData<IMongoCategory[]>('getCategories');

    return (
        <Autocomplete
            id="category"
            options={categories || []}
            onChange={(_e, value) => setFieldValue('category', value || '')}
            value={values.category._id ? values.category : null}
            getOptionLabel={(option) => option.displayName}
            isOptionEqualToValue={(option, value) => option._id === value._id}
            sx={{ width: 300 }}
            renderInput={(params) => (
                <TextField
                    {...params}
                    error={Boolean(touched.category && errors.category)}
                    fullWidth
                    helperText={(touched.category && errors.category?._id) || errors.category?.displayName || errors.category?.name}
                    name="category"
                    variant="outlined"
                    label={i18next.t('wizard.category')}
                />
            )}
        />
    );
};

export { ChooseCategory, chooseCategorySchema };

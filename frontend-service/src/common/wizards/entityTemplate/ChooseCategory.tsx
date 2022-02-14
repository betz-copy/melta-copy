import React, { useEffect } from 'react';
import { TextField, Autocomplete, CircularProgress } from '@mui/material';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import i18next from 'i18next';
import { useAxios } from '../../../axios';
import { environment } from '../../../globals';
import { EntityTemplateWizardValues } from './index';
import { IMongoCategory } from '../../../interfaces';
import { StepComponentProps } from '../index';

const chooseCategorySchema = {
    category: Yup.object({
        _id: Yup.string().required(i18next.t('validation.required')),
        name: Yup.string().required(i18next.t('validation.required')),
        displayName: Yup.string().required(i18next.t('validation.required')),
    }).required(i18next.t('validation.required')),
};

const ChooseCategory: React.FC<StepComponentProps<EntityTemplateWizardValues>> = ({ values, touched, errors, setFieldValue }) => {
    const [{ data: categories, loading: categoriesLoading, error: getCategoriesError }, getCategories] = useAxios<IMongoCategory[]>(
        environment.api.categories,
    );

    useEffect(() => {
        getCategories();
    }, [getCategories]);

    useEffect(() => {
        if (getCategoriesError) {
            toast.error('failed to get categories');
        }
    }, [getCategoriesError]);

    return (
        <Autocomplete
            id="category"
            options={categories || []}
            onChange={(e, value) => setFieldValue('category', value || '')}
            loading={categoriesLoading}
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
                    InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                            <>
                                {categoriesLoading ? <CircularProgress color="inherit" size={20} /> : null}
                                {params.InputProps.endAdornment}
                            </>
                        ),
                    }}
                />
            )}
        />
    );
};

export { ChooseCategory, chooseCategorySchema };

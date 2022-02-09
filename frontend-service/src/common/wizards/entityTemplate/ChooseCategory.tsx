import React, { useEffect } from 'react';
import { TextField, Autocomplete, CircularProgress } from '@mui/material';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { useAxios } from '../../../axios';
import { environment } from '../../../globals';
import { EntityTemplateWizardValues } from './index';
import { IMongoCategory } from '../../../interfaces';
import { StepComponentProps } from '../index';

const chooseCategorySchema = {
    category: Yup.object({
        _id: Yup.string().required('חובה'),
        name: Yup.string().required('חובה'),
        displayName: Yup.string().required('חובה'),
    }).required('חובה'),
};

const ChooseCategory: React.FC<StepComponentProps<EntityTemplateWizardValues>> = ({ values, touched, errors, setFieldValue }) => {
    const [{ data: categories, loading: categoriesLoading, error: getCategoriesError }] = useAxios<IMongoCategory[]>(environment.api.categories);

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
            renderInput={(params) => (
                <TextField
                    {...params}
                    error={Boolean(touched.category && errors.category)}
                    fullWidth
                    helperText={(touched.category && errors.category?._id) || errors.category?.displayName || errors.category?.name}
                    name="category"
                    variant="outlined"
                    label="category"
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

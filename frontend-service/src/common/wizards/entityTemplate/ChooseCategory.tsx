import React from 'react';
import { TextField, Autocomplete } from '@mui/material';
import * as Yup from 'yup';
import i18next from 'i18next';
import { useQueryClient } from 'react-query';
import { ICategoryMap } from '../../../interfaces/categories';
import { useUserStore } from '../../../stores/user';
import { allowedCategories } from '../../../utils/permissions/templatePermissions';

const chooseCategorySchema = Yup.object({
    category: Yup.object({
        _id: Yup.string().required(i18next.t('validation.required')),
        name: Yup.string().required(i18next.t('validation.required')),
        displayName: Yup.string().required(i18next.t('validation.required')),
    }).required(i18next.t('validation.required')),
});

const ChooseCategory = (props) => {
    const { values, touched, errors, setFieldValue, isEditMode } = props;
    const queryClient = useQueryClient();
    const currentUser = useUserStore((state) => state.user);

    const categories = queryClient.getQueryData<ICategoryMap>('getCategories')!;

    return (
        <Autocomplete
            id="category"
            options={allowedCategories(categories, currentUser)}
            onChange={(_e, value) => setFieldValue('category', value || '')}
            value={values.category._id ? values.category : null}
            getOptionLabel={(option) => option.displayName}
            isOptionEqualToValue={(option, value) => option._id === value._id}
            sx={{ width: 240 }}
            renderInput={(params) => (
                <TextField
                    {...params}
                    error={Boolean(touched.category && errors.category)}
                    fullWidth
                    helperText={(touched.category && errors.category?._id) || errors.category?.displayName || errors.category?.name}
                    name="category"
                    variant="outlined"
                    label={i18next.t('category')}
                />
            )}
        />
    );
};

export { ChooseCategory, chooseCategorySchema };

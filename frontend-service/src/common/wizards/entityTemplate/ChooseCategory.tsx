import { Autocomplete, TextField } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import { useQueryClient } from 'react-query';
import { EntityTemplateWizardValues, ICategoryMap } from '../../../interfaces/template';
import { useUserStore } from '../../../stores/user';
import { allowedCategories } from '../../../utils/permissions/templatePermissions';
import { StepComponentProps } from '../index';

const ChooseCategory: React.FC<StepComponentProps<EntityTemplateWizardValues>> = ({ values, touched, errors, setFieldValue }) => {
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

export { ChooseCategory };

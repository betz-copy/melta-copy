import { Autocomplete, Grid, TextField } from '@mui/material';
import { IGetUnits } from '@packages/unit';
import i18next from 'i18next';
import React from 'react';
import { useQueryClient } from 'react-query';
import * as Yup from 'yup';
import { StepComponentProps } from '../../../../../common/wizards';
import { UnitWizardValues } from '.';

export const createOrEditSchema = {
    name: Yup.string().required(i18next.t('validation.required')),
    parentId: Yup.string().nullable(),
    disabled: Yup.boolean().default(false),
};

export const canEnableUnit = (filteredUnits: IGetUnits, parentId?: string) => !!parentId && !filteredUnits.find(({ _id }) => parentId === _id);

export const CreateOrEditStep: React.FC<StepComponentProps<UnitWizardValues, 'isEditMode'>> = ({
    initialValues,
    values,
    touched,
    errors,
    setFieldValue,
}) => {
    const queryClient = useQueryClient();
    const units = queryClient.getQueryData<IGetUnits>('getUnits')!;

    return (
        <Grid container direction="column" spacing={2}>
            <TextField
                name="name"
                label={i18next.t('wizard.displayName')}
                value={values.name}
                onChange={(e) => setFieldValue('name', e.target.value)}
                error={touched.name && Boolean(errors.name)}
                helperText={touched.name && errors.name}
            />

            <Autocomplete
                options={units.filter((unit) => unit._id !== initialValues._id)}
                onChange={(_e, value) => setFieldValue('parentId', value?._id || '')}
                value={units.find((unit) => unit._id === values.parentId)}
                getOptionLabel={(option) => option.name}
                sx={{ width: '220px' }}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        error={Boolean(touched.parentId && errors.parentId)}
                        helperText={touched.parentId ? errors.parentId : ''}
                        variant="outlined"
                        label={i18next.t('wizard.unit.parentUnit')}
                    />
                )}
            />
        </Grid>
    );
};

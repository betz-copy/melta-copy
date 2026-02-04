import { Grid, TextField } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import { useQueryClient } from 'react-query';
import * as Yup from 'yup';
import UnitSelect from '../../../../../common/inputs/UnitTreeSelect';
import { StepComponentProps } from '../../../../../common/wizards';
import { IGetUnits } from '../../../../../interfaces/units';
import { UnitWizardValues } from '.';

export const createOrEditSchema = {
    name: Yup.string().required(i18next.t('validation.required')),
    parentId: Yup.string().nullable(),
    disabled: Yup.boolean().default(false),
};

export const canEnableUnit = (filteredUnits: IGetUnits, parentId?: string) => !!parentId && !filteredUnits.find(({ _id }) => parentId === _id);

export const CreateOrEditStep: React.FC<StepComponentProps<UnitWizardValues, 'isEditMode'>> = ({ values, touched, errors, setFieldValue }) => {
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

            <UnitSelect
                label={i18next.t('wizard.unit.parentUnit')}
                value={units.find((unit) => unit._id === values.parentId)?._id}
                onChange={(value) => {
                    setFieldValue('parentId', value || '');
                }}
                error={Boolean(touched.parentId && errors.parentId)}
                textFieldProps={{ sx: { width: '220px' } }}
            />
        </Grid>
    );
};

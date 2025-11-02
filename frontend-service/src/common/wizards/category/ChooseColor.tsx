import { FormHelperText, Grid } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import * as Yup from 'yup';
import { ColorPicker } from '../../inputs/ColorPicker';
import { StepComponentProps } from '../index';
import { CategoryWizardValues } from './index';

const chooseColorSchema = { color: Yup.string().required(i18next.t('validation.colorRequired')) };

const ChooseColor: React.FC<StepComponentProps<CategoryWizardValues>> = ({ values, setFieldValue, touched, errors }) => {
    return (
        <Grid marginTop="0px">
            <FormHelperText error>{touched.color && errors.color}</FormHelperText>
            <ColorPicker color={values.color} onColorChange={(color) => setFieldValue('color', color ?? '')} />
        </Grid>
    );
};

export { ChooseColor, chooseColorSchema };

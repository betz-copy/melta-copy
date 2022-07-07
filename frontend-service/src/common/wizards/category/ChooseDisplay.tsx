import React from 'react';
import { Grid } from '@mui/material';
import i18next from 'i18next';
import { CategoryWizardValues } from './index';
import { StepComponentProps } from '../index';
import ColorPicker from '../../inputs/ColorPicker';
import { ImagePicker } from '../../inputs/ImagePicker';

const ChooseDisplay: React.FC<StepComponentProps<CategoryWizardValues>> = ({ values, setFieldValue }) => {
    const colors = ['#B80000', '#E65100', '#FCDC00', '#F78DA7', '#7B1FA2', '#0D47A1', '#B3E5FC', '#C8E6C9', '#33691E', '#607D8B'];

    return (
        <Grid container direction="column" alignItems="center" spacing={2}>
            <Grid item>
                <ImagePicker
                    image={values.file}
                    setImage={(image) => {
                        setFieldValue('file', image || null);
                    }}
                    defaultInputType={values.file ? 'chooseFile' : 'chooseFromOptions'}
                />
            </Grid>

            <Grid item>
                <ColorPicker
                    colors={colors}
                    color={values.color}
                    setColor={(value) => setFieldValue('color', value)}
                    text={i18next.t('wizard.color')}
                />
            </Grid>
        </Grid>
    );
};

export { ChooseDisplay };

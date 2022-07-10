import React from 'react';
import { CirclePicker } from 'react-color';
import { Grid, IconButton } from '@mui/material';
import { CloseOutlined as DeleteIcon } from '@mui/icons-material';
import { CategoryWizardValues } from './index';
import { StepComponentProps } from '../index';

const ChooseColor: React.FC<StepComponentProps<CategoryWizardValues>> = ({ values, setFieldValue }) => {
    const colors = ['#B80000', '#E65100', '#FCDC00', '#F78DA7', '#7B1FA2', '#0D47A1', '#B3E5FC', '#C8E6C9', '#33691E', '#607D8B'];

    return (
        <Grid container direction="column" alignItems="center">
            <CirclePicker
                color={values.color}
                colors={colors}
                onChange={(color) => setFieldValue('color', color.hex)}
                width="50%"
                circleSize={40}
                styles={{ default: { card: { justifyContent: 'space-around' } } }}
            />

            <Grid item marginTop="1rem">
                <IconButton onClick={() => setFieldValue('color', '#ffffff')}>
                    <DeleteIcon />
                </IconButton>
            </Grid>
        </Grid>
    );
};

export { ChooseColor };

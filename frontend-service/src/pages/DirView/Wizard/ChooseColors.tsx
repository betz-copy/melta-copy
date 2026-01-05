import { Box, Divider, Typography } from '@mui/material';
import { Colors } from '@packages/workspace';
import i18next from 'i18next';
import React from 'react';
import * as Yup from 'yup';
import { ColorPicker } from '../../../common/inputs/ColorPicker';
import { StepComponentProps } from '../../../common/wizards/index';
import { WorkspaceWizardValues } from './index';

export const chooseColorsSchema = Yup.object().shape({
    colors: Yup.object().shape(
        Object.entries(Colors).reduce((acc, [key]) => ({ ...acc, [key]: Yup.string().required(i18next.t('validation.required')) }), {}),
    ),
});

export const ChooseColors: React.FC<StepComponentProps<WorkspaceWizardValues>> = ({ values, setFieldValue }) => {
    return (
        <Box display="flex" flexDirection="column" paddingBottom="2rem">
            {Object.entries(values.colors).map(([key, value]) => (
                <Box key={key} display="flex" alignItems="center" gap="1rem">
                    <Typography variant="h4" whiteSpace="nowrap">
                        {i18next.t('workspaces.color', { color: i18next.t(`workspaces.colors.${key}`) })}
                    </Typography>

                    <Divider orientation="vertical" flexItem sx={{ backgroundColor: '#000' }} />

                    <ColorPicker
                        color={value}
                        onColorChange={(color) => {
                            const newColors = { ...values.colors };
                            newColors[key] = color;
                            setFieldValue('colors', newColors);
                        }}
                    />
                </Box>
            ))}
        </Box>
    );
};

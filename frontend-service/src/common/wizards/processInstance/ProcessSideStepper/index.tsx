import React from 'react';
import { Stepper, Step, StepLabel, Grid, Paper } from '@mui/material';
import { BlueTitle } from '../../../BlueTitle';
import { StyleStepIcon, StyleStepperConnector } from './StepperStyle';
import { useDarkModeStore } from '../../../../stores/darkMode';

interface IProcessSideStepperProps {
    activeStep: number;
    steps: string[];
    title: string;
}

// TODO - right side component
export const ProcessSideStepper: React.FC<IProcessSideStepperProps> = ({ activeStep, steps, title }) => {
    const darkMode = useDarkModeStore((state) => state.darkMode);

    return (
        <Grid
            container
            direction="column"
            alignItems="center"
            padding={3}
            style={{
                backgroundColor: darkMode ? '#343536' : '#F0F2F7',
                borderBottomLeftRadius: '20px',
                borderTopLeftRadius: '20px',
                boxShadow: '10px 10px 15px 10px #888888',
            }}
        >
            <Grid item>
                <BlueTitle title={title} component="h5" variant="h5" style={{ fontWeight: 700, opacity: 0.9 }} />
            </Grid>
            <Grid item marginTop="-30px">
                <Stepper activeStep={activeStep} orientation="vertical" connector={<StyleStepperConnector />}>
                    {steps.map((label) => (
                        <Step key={label}>
                            <StepLabel StepIconComponent={StyleStepIcon}>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>
            </Grid>
        </Grid>
    );
};

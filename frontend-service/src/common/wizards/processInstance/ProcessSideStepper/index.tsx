import React from 'react';
import { Stepper, Step, StepLabel, Grid } from '@mui/material';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../store';
import { BlueTitle } from '../../../../common/BlueTitle';
import { StyleStepIcon, StyleStepperConnector } from './StepperStyle';

interface IProcessSideStepperProps {
    activeStep: number;
    steps: string[];
    title: string;
}

export const ProcessSideStepper: React.FC<IProcessSideStepperProps> = ({ activeStep, steps, title }) => {
    const darkMode = useSelector((state: RootState) => state.darkMode);

    return (
        <Grid container direction="column" alignItems="center" padding={3} style={{ backgroundColor: darkMode ? '#343536' : '#f8fbfd' }}>
            <Grid item>
                <BlueTitle title={title} component={'h5'} variant={'h5'} style={{ fontWeight: 700, opacity: 0.9 }} />
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

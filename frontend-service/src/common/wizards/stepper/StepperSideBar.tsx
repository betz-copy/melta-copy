import React from 'react';
import { Grid } from '@mui/material';
import { Done as DoneIcon } from '@mui/icons-material';

import { StepsType } from '..';
import { StepNumberTypography, StepNameTypography, DashedVerticalLine } from './index.styles';

const StepperSideBar = <T extends object>({ activeStep, steps }: { activeStep: number; steps: StepsType<T> }): JSX.Element | null => {
    return (
        <>
            {steps.map((step, index) => {
                // eslint-disable-next-line no-nested-ternary
                const type = activeStep < index ? 'futureStep' : activeStep === index ? 'currentStep' : 'finishedStep';

                return (
                    <Grid key={step.label} container direction="column">
                        <Grid item>
                            <Grid container alignItems="center">
                                <Grid item>
                                    <StepNumberTypography type={type}>
                                        {type === 'finishedStep' ? <DoneIcon fontSize="small" /> : index + 1}
                                    </StepNumberTypography>
                                </Grid>
                                <Grid item>
                                    <StepNameTypography type={type}>{step.label}</StepNameTypography>
                                </Grid>
                            </Grid>
                        </Grid>
                        {index !== steps.length - 1 && (
                            <Grid item>
                                <DashedVerticalLine />
                            </Grid>
                        )}
                    </Grid>
                );
            })}
        </>
    );
};

export { StepperSideBar };

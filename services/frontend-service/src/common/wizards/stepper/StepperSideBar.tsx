import React, { Fragment } from 'react';
import { Grid } from '@mui/material';
import { Done as DoneIcon } from '@mui/icons-material';

import { StepsType } from '..';
import { StepNumberTypography, StepNameTypography, DashedHorizontalLine } from './index.styles';

const StepperSideBar = <T extends object>({ activeStep, steps }: { activeStep: number; steps: StepsType<T> }): JSX.Element | null => {
    return (
        <Grid container justifyContent="space-around" alignItems="center">
            {steps.map((step, index) => {
                // eslint-disable-next-line no-nested-ternary
                const type = activeStep < index ? 'futureStep' : activeStep === index ? 'currentStep' : 'finishedStep';

                return (
                    <Fragment key={step.label}>
                        <Grid>
                            <Grid container justifyContent="center" alignItems="center">
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
                        {index !== steps.length - 1 && <DashedHorizontalLine />}
                    </Fragment>
                );
            })}
        </Grid>
    );
};

export { StepperSideBar };

import React, { Fragment } from 'react';
import { Grid } from '@mui/material';
import { Done as DoneIcon } from '@mui/icons-material';

import { FormikProps } from 'formik';
import { StepComponentHelpers, StepsType } from '..';
import { StepNumberTypography, StepNameTypography, DashedHorizontalLine, DashedVerticalLine, StepDescriptionTypography } from './index.styles';

const StepperSideBar = <T extends object>({
    activeStep,
    steps,
    direction,
    componentProps,
    showPrevSteps,
}: {
    activeStep: number;
    steps: StepsType<T>;
    direction: 'row' | 'column';
    componentProps: { formikProps: FormikProps<T>; helpers: StepComponentHelpers };
    showPrevSteps: boolean;
}): JSX.Element | null => {
    return (
        <Grid container direction={direction} justifyContent={direction === 'row' ? 'center' : 'start'} alignItems="center">
            {steps.map((step, index) => {
                // eslint-disable-next-line no-nested-ternary
                const type = activeStep < index ? 'futureStep' : activeStep === index ? 'currentStep' : 'finishedStep';

                return (
                    <Fragment key={step.label}>
                        <Grid container direction={direction} justifyContent={direction === 'row' ? 'center' : 'start'} alignItems="flex-start">
                            <Grid container justifyContent={direction === 'row' ? 'center' : 'start'} alignItems="center">
                                <Grid item>
                                    <StepNumberTypography type={type}>
                                        {type === 'finishedStep' ? <DoneIcon fontSize="small" /> : index + 1}
                                    </StepNumberTypography>
                                </Grid>
                                <Grid item>
                                    <StepNameTypography type={type}>{step.label}</StepNameTypography>
                                </Grid>
                                <Grid item marginLeft="10px">
                                    {step.description && <StepDescriptionTypography type={type}>{step.description}</StepDescriptionTypography>}
                                </Grid>
                            </Grid>
                            <Grid container direction={direction === 'row' ? 'column' : 'row'} alignItems="center">
                                {index !== steps.length - 1 && (direction === 'row' ? <DashedHorizontalLine /> : <DashedVerticalLine />)}
                                {direction === 'column' &&
                                    (type === 'currentStep' || (showPrevSteps && type === 'finishedStep')) &&
                                    step.component(componentProps.formikProps, componentProps.helpers)}
                            </Grid>
                        </Grid>
                    </Fragment>
                );
            })}
        </Grid>
    );
};

export { StepperSideBar };

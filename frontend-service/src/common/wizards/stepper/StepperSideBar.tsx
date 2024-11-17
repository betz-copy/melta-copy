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
    if (direction === 'column')
        return (
            <Grid container justifyContent="start" alignItems="center">
                {steps.map((step, index) => {
                    // eslint-disable-next-line no-nested-ternary
                    const type = activeStep < index ? 'futureStep' : activeStep === index ? 'currentStep' : 'finishedStep';
                    if (step.invisibleBeforeStep && type === 'futureStep') return undefined;

                    return (
                        <Fragment key={step.label}>
                            <Grid container justifyContent="start" alignItems="flex-start">
                                <Grid container justifyContent="start" alignItems="center">
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
                                <Grid container alignItems="center">
                                    {index !== steps.length - 1 &&
                                        (type === 'finishedStep' ||
                                            ((type === 'currentStep' || type === 'futureStep') && !steps[index + 1].invisibleBeforeStep)) && (
                                            <DashedVerticalLine />
                                        )}
                                    {(type === 'currentStep' || (showPrevSteps && type === 'finishedStep')) &&
                                        step.component(componentProps.formikProps, componentProps.helpers)}
                                </Grid>
                            </Grid>
                        </Fragment>
                    );
                })}
            </Grid>
        );

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

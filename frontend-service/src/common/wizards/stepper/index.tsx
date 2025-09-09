import { Done as DoneIcon } from '@mui/icons-material';
import { Grid } from '@mui/material';
import { FormikProps } from 'formik';
import React, { Fragment, JSX } from 'react';
import { StepType } from '..';
import { DashedHorizontalLine, DashedVerticalLine, StepDescriptionTypography, StepNameTypography, StepNumberTypography } from './index.styles';

const Stepper = <T extends object>({
    activeStep,
    steps,
    direction,
    formikProps,
    setBlock,
    isEditMode,
    showPrevSteps,
    alignItems,
}: {
    activeStep: number;
    steps: StepType<T>[];
    direction: 'row' | 'column';
    formikProps: FormikProps<T>;
    setBlock: React.Dispatch<React.SetStateAction<boolean>>;
    isEditMode: boolean;
    showPrevSteps: boolean;
    alignItems: 'start' | 'center';
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
                            <Grid direction="column" justifyContent="start" alignItems="flex-start" size={{ xs: 12 }}>
                                <Grid container direction="row" justifyContent="start" alignItems="center">
                                    <Grid display="flex" justifyContent="center" alignContent="center">
                                        <StepNumberTypography type={type} direction="column">
                                            {type === 'finishedStep' ? <DoneIcon fontSize="small" /> : index + 1}
                                        </StepNumberTypography>
                                    </Grid>
                                    <Grid>
                                        <StepNameTypography type={type} direction={direction}>
                                            {step.label}
                                        </StepNameTypography>
                                    </Grid>
                                    <Grid marginLeft="10px">
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
                                        step.component(formikProps, { isEditMode, setBlock })}
                                </Grid>
                            </Grid>
                        </Fragment>
                    );
                })}
            </Grid>
        );

    return (
        <Grid container direction={direction} justifyContent="space-around" alignItems="center">
            {steps.length > 1 &&
                steps.map((step, index) => {
                    // eslint-disable-next-line no-nested-ternary
                    const type = activeStep < index ? 'futureStep' : activeStep === index ? 'currentStep' : 'finishedStep';

                    return (
                        <Fragment key={step.label}>
                            <Grid>
                                <Grid container justifyContent="center" alignItems="center">
                                    <Grid display="flex" justifyContent="center" alignContent="center">
                                        <StepNumberTypography type={type} direction="row">
                                            {type === 'finishedStep' ? <DoneIcon fontSize="small" /> : index + 1}
                                        </StepNumberTypography>
                                    </Grid>
                                    <Grid>
                                        <StepNameTypography type={type} direction={direction}>
                                            {step.label}
                                        </StepNameTypography>
                                    </Grid>
                                </Grid>
                            </Grid>
                            {index !== steps.length - 1 && <DashedHorizontalLine />}
                        </Fragment>
                    );
                })}
            <Grid
                container
                direction="column"
                justifyContent="space-between"
                alignItems={alignItems}
                height="100%"
                marginBottom="0.5rem"
                marginTop="2rem"
                width="100%"
            >
                {steps[activeStep].component(formikProps, { isEditMode, setBlock })}
            </Grid>
        </Grid>
    );
};

export { Stepper };

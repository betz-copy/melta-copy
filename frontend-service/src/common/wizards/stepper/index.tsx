import React from 'react';
import { Grid } from '@mui/material';
import { FormikProps } from 'formik';

import { StepsType } from '..';
import { StepperActions } from './StepperActions';
import { StepperSideBar } from './StepperSideBar';

const Stepper = <T extends object>({
    activeStep,
    handleBack,
    steps,
    isLoading,
    formikProps,
    isEditMode,
}: {
    activeStep: number;
    handleBack: () => void;
    steps: StepsType<T>;
    isLoading: boolean;
    formikProps: FormikProps<T>;
    isEditMode?: boolean;
}): JSX.Element | null => {
    return (
        <Grid container minWidth="80vh">
            <Grid container marginBottom="5%">
                <StepperSideBar steps={steps} activeStep={activeStep} />
            </Grid>
            <Grid container direction="column" justifyContent="space-between" alignItems="center" height="100%" marginBottom="5%">
                {steps[activeStep].component(formikProps, isEditMode)}
            </Grid>
            <StepperActions
                handleBack={handleBack}
                isLastStep={activeStep === steps.length - 1}
                isFirstStep={activeStep === 0}
                isLoading={isLoading}
            />
        </Grid>
    );
};

export { Stepper };

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
}: {
    activeStep: number;
    handleBack: () => void;
    steps: StepsType<T>;
    isLoading: boolean;
    formikProps: FormikProps<T>;
}): JSX.Element | null => {
    return (
        <Grid container minWidth="80vh" minHeight="30vh">
            <Grid item xs={4}>
                <StepperSideBar steps={steps} activeStep={activeStep} />
            </Grid>
            <Grid item xs={8} paddingTop="5px">
                <Grid container direction="column" justifyContent="space-between" alignItems="center" height="100%">
                    <Grid item>
                        <>{steps[activeStep].component(formikProps)}</>
                    </Grid>
                    <Grid item width="80%">
                        <StepperActions
                            handleBack={handleBack}
                            isLastStep={activeStep === steps.length - 1}
                            isFirstStep={activeStep === 0}
                            isLoading={isLoading}
                        />
                    </Grid>
                </Grid>
            </Grid>
        </Grid>
    );
};

export { Stepper };

import React, { useState } from 'react';
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
    direction,
    showPrevSteps = false,
}: {
    activeStep: number;
    handleBack: () => void;
    steps: StepsType<T>;
    isLoading: boolean;
    formikProps: FormikProps<T>;
    isEditMode: boolean;
    direction: 'row' | 'column';
    showPrevSteps?: boolean;
}): JSX.Element | null => {
    const [block, setBlock] = useState(false);

    return (
        <Grid container minWidth="70vh" spacing={2}>
            {steps.length > 1 && (
                <Grid item width="100%">
                    <StepperSideBar
                        steps={steps}
                        activeStep={activeStep}
                        direction={direction}
                        componentProps={{ formikProps, helpers: { isEditMode, setBlock } }}
                        showPrevSteps={showPrevSteps}
                    />
                </Grid>
            )}
            {direction === 'row' && (
                <Grid
                    container
                    direction="column"
                    justifyContent="space-between"
                    alignItems="center"
                    height="100%"
                    marginBottom="0.5rem"
                    marginTop="1rem"
                >
                    {steps[activeStep].component(formikProps, { isEditMode, setBlock })}
                </Grid>
            )}
            {steps[activeStep].stepperActions?.disable !== 'all' && (
                <StepperActions
                    step={steps[activeStep]}
                    handleBack={handleBack}
                    isLastStep={activeStep === steps.length - 1}
                    isFirstStep={activeStep === 0}
                    isLoading={isLoading || block}
                    formikProps={formikProps}
                />
            )}
        </Grid>
    );
};

export { Stepper };

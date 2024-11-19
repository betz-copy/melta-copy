import React from 'react';
import { Grid } from '@mui/material';
import { FormikProps } from 'formik';
import { StepType } from '..';
import { StepperSideBar } from './StepperSideBar';

const Stepper = <T extends object>({
    activeStep,
    steps,
    formikProps,
    setBlock,
    isEditMode,
    direction,
    showPrevSteps = false,
}: {
    activeStep: number;
    steps: StepType<T>[];
    formikProps: FormikProps<T>;
    setBlock: React.Dispatch<React.SetStateAction<boolean>>;
    isEditMode: boolean;
    direction: 'row' | 'column';
    showPrevSteps?: boolean;
}): JSX.Element | null => {
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
        </Grid>
    );
};

export { Stepper };

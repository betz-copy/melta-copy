import React, { PropsWithChildren } from 'react';
import { Dialog, DialogTitle, DialogContent, Stepper, Step, StepLabel, StepContent, Button, Box, CircularProgress } from '@mui/material';
import { Formik, Form, FormikProps } from 'formik';
import * as Yup from 'yup';
// eslint-disable-next-line import/no-unresolved
import { ObjectShape } from 'yup/lib/object';

export type StepsType<T extends object> = { label: string; component: (formikProps: FormikProps<T>) => JSX.Element; validation: ObjectShape }[];

const Wizard = <T extends object>({
    open,
    handleClose,
    title,
    steps,
    initialValues,
    submitOptions,
    initalStep = 0,
}: PropsWithChildren<{
    open: boolean;
    handleClose: () => void;
    title: string;
    steps: StepsType<T>;
    initialValues: T;
    submitOptions: { func: (values: T) => Promise<any>; loading: boolean };
    initalStep?: number;
}>): JSX.Element | null => {
    const [activeStep, setActiveStep] = React.useState(initalStep);
    const isLastStep = activeStep === steps.length - 1;

    const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    return (
        <Dialog open={open} onClose={handleClose}>
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
                <Formik
                    initialValues={initialValues}
                    validationSchema={Yup.object(steps[activeStep].validation)}
                    onSubmit={async (values, actions) => {
                        if (isLastStep) {
                            await submitOptions.func(values);
                        } else {
                            setActiveStep(activeStep + 1);
                            actions.setTouched({});
                            actions.setSubmitting(false);
                        }
                    }}
                >
                    {(formikProps: FormikProps<T>) => (
                        <Form>
                            <Stepper activeStep={activeStep} orientation="vertical">
                                {steps.map((step, index) => (
                                    <Step key={step.label}>
                                        <StepLabel>{step.label}</StepLabel>
                                        <StepContent>
                                            {step.component(formikProps)}
                                            <Box>
                                                {submitOptions.loading ? (
                                                    <CircularProgress size={24} />
                                                ) : (
                                                    <>
                                                        <Button variant="contained" type="submit" disabled={submitOptions.loading}>
                                                            {isLastStep ? 'Finish' : 'Continue'}
                                                        </Button>
                                                        <Button disabled={index === 0} onClick={handleBack}>
                                                            Back
                                                        </Button>
                                                    </>
                                                )}
                                            </Box>
                                        </StepContent>
                                    </Step>
                                ))}
                            </Stepper>
                        </Form>
                    )}
                </Formik>
            </DialogContent>
        </Dialog>
    );
};

export { Wizard };

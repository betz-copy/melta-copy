import React, { PropsWithChildren, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, Stepper, Step, StepLabel, StepContent, Button, Box, CircularProgress } from '@mui/material';
import { Formik, Form, FormikProps } from 'formik';
import * as Yup from 'yup';
// eslint-disable-next-line import/no-unresolved
import { ObjectShape } from 'yup/lib/object';

export type StepComponentProps<T extends object> = FormikProps<T> & { isEditMode?: boolean };

export type WizardBaseType<T extends object> = {
    open: boolean;
    handleClose: () => void;
    initialValues?: T;
    initalStep?: number;
    isEditMode?: boolean;
};

export type StepsType<T extends object> = {
    label: string;
    component: (formikProps: StepComponentProps<T>) => JSX.Element;
    validation: ObjectShape;
}[];

const Wizard = <T extends object>({
    open,
    handleClose,
    title,
    steps,
    initialValues,
    initalStep = 0,
    isEditMode = false,
    isLoading,
    submitFucntion,
}: PropsWithChildren<
    WizardBaseType<T> & {
        initialValues: T;
        title: string;
        steps: StepsType<T>;
        isLoading: boolean;
        submitFucntion: (values: T) => Promise<any>;
    }
>): JSX.Element | null => {
    const [activeStep, setActiveStep] = React.useState(initalStep);
    const isLastStep = activeStep === steps.length - 1;

    const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    useEffect(() => {
        setActiveStep(initalStep);
    }, [open, initalStep]);

    return (
        <Dialog open={open} onClose={handleClose}>
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
                <Formik
                    initialValues={initialValues}
                    validationSchema={Yup.object(steps[activeStep].validation)}
                    onSubmit={async (values, actions) => {
                        if (isLastStep) {
                            await submitFucntion(values);
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
                                            {step.component({ ...formikProps, isEditMode })}
                                            <Box>
                                                {isLoading ? (
                                                    <CircularProgress size={20} />
                                                ) : (
                                                    <>
                                                        <Button variant="contained" type="submit" disabled={isLoading}>
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

import React, { PropsWithChildren } from 'react';
import { Dialog, DialogTitle, DialogContent, Stepper, Step, StepLabel, StepContent, Button, Box, CircularProgress } from '@mui/material';
import { Formik, Form, FormikProps } from 'formik';
import * as Yup from 'yup';
// eslint-disable-next-line import/no-unresolved
import { ObjectShape } from 'yup/lib/object';
import { Method } from 'axios';
import { useAxios } from '../../axios';

export type StepsType<T extends object> = { label: string; component: (formikProps: FormikProps<T>) => JSX.Element; validation: ObjectShape }[];

const Wizard = <T extends object>({
    open,
    handleClose,
    title,
    steps,
    initialValues,
    submitOptions,
}: PropsWithChildren<{
    open: boolean;
    handleClose: () => void;
    title: string;
    steps: StepsType<T>;
    initialValues: T;
    submitOptions: { method: Method; url: string; bodyFormatter: (values: T) => any };
}>): JSX.Element | null => {
    const [activeStep, setActiveStep] = React.useState(0);
    const isLastStep = activeStep === steps.length - 1;

    const { method, url, bodyFormatter } = submitOptions;
    const [{ loading }, executeRequest] = useAxios({ method, url }, { manual: true });

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
                            await executeRequest(bodyFormatter(values));
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
                                                {loading ? (
                                                    <CircularProgress size={24} />
                                                ) : (
                                                    <>
                                                        <Button variant="contained" type="submit" disabled={loading}>
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

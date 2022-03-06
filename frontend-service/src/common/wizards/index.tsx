import React, { PropsWithChildren, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, Divider, IconButton } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { Formik, Form, FormikProps } from 'formik';
import * as Yup from 'yup';
// eslint-disable-next-line import/no-unresolved
import { ObjectShape } from 'yup/lib/object';

import { Stepper } from './stepper';

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
    const [activeStep, setActiveStep] = useState(initalStep);
    const isLastStep = activeStep === steps.length - 1;

    const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="lg">
            <DialogTitle>
                {title}
                <IconButton
                    aria-label="close"
                    onClick={handleClose}
                    sx={{
                        position: 'absolute',
                        right: 12,
                        top: 12,
                        color: (theme) => theme.palette.grey[500],
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <Divider />
            <DialogContent>
                <Formik
                    initialValues={initialValues}
                    validationSchema={Yup.object(steps[activeStep].validation)}
                    onSubmit={async (values, actions) => {
                        if (isLastStep) {
                            await submitFucntion(values);
                        } else {
                            setActiveStep((prevActiveStep) => prevActiveStep + 1);
                            actions.setTouched({});
                            actions.setSubmitting(false);
                        }
                    }}
                >
                    {(formikProps: FormikProps<T>) => (
                        <Form>
                            <Stepper activeStep={activeStep} handleBack={handleBack} steps={steps} isLoading={isLoading} formikProps={formikProps} />
                        </Form>
                    )}
                </Formik>
            </DialogContent>
        </Dialog>
    );
};

export { Wizard };

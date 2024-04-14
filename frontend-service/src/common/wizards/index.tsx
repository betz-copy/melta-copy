import React, { PropsWithChildren, useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, IconButton } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { Formik, Form, FormikProps, FormikConfig } from 'formik';
import * as Yup from 'yup';
import { ObjectShape } from 'yup/lib/object';

import { useSelector } from 'react-redux';
import { Stepper } from './stepper';
import { RootState } from '../../store';

export interface StepComponentHelpers {
    isEditMode: boolean;
    setBlock: React.Dispatch<React.SetStateAction<boolean>>;
    isError?: boolean;
    setIsError?: React.Dispatch<React.SetStateAction<boolean>>;
}

export type StepComponentProps<T extends object, helpers extends keyof StepComponentHelpers = never> = FormikProps<T> &
    Pick<StepComponentHelpers, helpers>;

export type WizardBaseType<T extends object> = {
    open: boolean;
    handleClose: () => void;
    initialValues?: T;
    initalStep?: number;
    isEditMode?: boolean;
    isError?: boolean;
    setIsError?: React.Dispatch<React.SetStateAction<boolean>>;
};

export type StepsType<T extends object> = {
    label: string;
    component: (formikProps: FormikProps<T>, helpers: StepComponentHelpers) => JSX.Element;
    validationSchema?: ObjectShape | Yup.ObjectSchema<ObjectShape>;
    validate?: FormikConfig<T>['validate'];
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
    isEditMode,
    isError,
    setIsError,
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

    const darkMode = useSelector((state: RootState) => state.darkMode);

    const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    useEffect(() => {
        setActiveStep(initalStep);
    }, [open, initalStep]);

    return (
        <Dialog
            open={open}
            maxWidth="md"
            fullWidth
            PaperProps={{ sx: { bgcolor: darkMode ? '#060606' : 'white' } }}
            style={{ height: '80%', margin: 'auto' }}
            disableEnforceFocus
        >
            {/* disableEnforceFocus added for 'raqb' component as mentioned in docs https://github.com/ukrbublik/react-awesome-query-builder#api */}
            <DialogTitle color={(theme) => theme.palette.primary.main} fontSize="20px" fontWeight="600" fontFamily="Rubik">
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
            <DialogContent>
                <Formik
                    initialValues={initialValues}
                    validationSchema={
                        steps[activeStep].validationSchema instanceof Yup.ObjectSchema
                            ? steps[activeStep].validationSchema
                            : Yup.object(steps[activeStep].validationSchema as ObjectShape)
                    }
                    validate={steps[activeStep].validate}
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
                            <Stepper
                                activeStep={activeStep}
                                handleBack={handleBack}
                                steps={steps}
                                isLoading={isLoading}
                                formikProps={formikProps}
                                isEditMode={!!isEditMode}
                                isError={isError}
                                setIsError={setIsError}
                            />
                        </Form>
                    )}
                </Formik>
            </DialogContent>
        </Dialog>
    );
};

export { Wizard };

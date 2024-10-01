import React, { PropsWithChildren, useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, IconButton } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { Formik, Form, FormikProps, FormikConfig } from 'formik';
import * as Yup from 'yup';
import { ObjectShape } from 'yup/lib/object';
import { Stepper } from './stepper';
import { useDarkModeStore } from '../../stores/darkMode';

export interface StepComponentHelpers {
    isEditMode: boolean;
    setBlock: React.Dispatch<React.SetStateAction<boolean>>;
}

export type StepComponentProps<T extends object, helpers extends keyof StepComponentHelpers = never> = FormikProps<T> &
    Pick<StepComponentHelpers, helpers>;

export type WizardBaseType<T extends object> = {
    open: boolean;
    handleClose: () => void;
    initialValues?: T;
    initialStep?: number;
    isEditMode?: boolean;
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
    initialStep = 0,
    isLoading,
    submitFunction,
    isEditMode,
}: PropsWithChildren<
    WizardBaseType<T> & {
        initialValues: T;
        title: string;
        steps: StepsType<T>;
        isLoading: boolean;
        submitFunction: (values: T) => Promise<any>;
    }
>): JSX.Element | null => {
    const [activeStep, setActiveStep] = useState(initialStep);
    const isLastStep = activeStep === steps.length - 1;

    const darkMode = useDarkModeStore((state) => state.darkMode);

    const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    useEffect(() => {
        setActiveStep(initialStep);
    }, [open, initialStep]);

    return (
        <Dialog
            open={open}
            maxWidth="lg"
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
                    onClick={async () => {
                        handleClose();
                    }}
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
                            await submitFunction(values);
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
                            />
                        </Form>
                    )}
                </Formik>
            </DialogContent>
        </Dialog>
    );
};

export { Wizard };

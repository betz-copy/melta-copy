import React, { PropsWithChildren, useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, IconButton, Box } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { Formik, Form, FormikProps, FormikConfig, FormikHelpers } from 'formik';
import * as Yup from 'yup';
import { ObjectShape } from 'yup/lib/object';
import { useDarkModeStore } from '../../stores/darkMode';
import { StepperActions } from './stepper/StepperActions';
import { Stepper } from './stepper';

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

export type StepType<T extends object> = {
    label: string;
    description?: string;
    component: (formikProps: FormikProps<T>, helpers: StepComponentHelpers) => JSX.Element;
    validationSchema?: ObjectShape | Yup.ObjectSchema<ObjectShape>;
    validate?: FormikConfig<T>['validate'];
    stepperActions?: {
        disable?: 'all' | 'back' | 'next';
        back?: { text?: string; onClick?: () => void };
        next?: { text?: string; onClick?: (values: T, formikHelpers: FormikHelpers<T>) => Promise<void> | void };
    };
    invisibleBeforeStep?: boolean;
};

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
    direction = 'row',
    showPrevSteps = false,
}: PropsWithChildren<
    WizardBaseType<T> & {
        initialValues: T;
        title: string;
        steps: StepType<T>[];
        isLoading: boolean;
        submitFunction: (values: T) => Promise<any>;
        direction?: 'row' | 'column';
        showPrevSteps?: boolean;
    }
>): JSX.Element | null => {
    const [activeStep, setActiveStep] = useState(initialStep);
    const isLastStep = activeStep === steps.length - 1;

    const [block, setBlock] = useState(false);

    const darkMode = useDarkModeStore((state) => state.darkMode);

    const handleBack = () => {
        console.log({ initialValues, activeStep });

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
            style={{ height: '100%', margin: 'auto' }}
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
                            await steps[activeStep].stepperActions?.next?.onClick?.(values, actions);
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
                                steps={steps}
                                formikProps={formikProps}
                                setBlock={setBlock}
                                isEditMode={!!isEditMode}
                                direction={direction}
                                showPrevSteps={showPrevSteps}
                            />
                            {steps[activeStep].stepperActions?.disable !== 'all' && (
                                <Box sx={{ position: 'sticky', bottom: 0 }}>
                                    <StepperActions
                                        step={steps[activeStep]}
                                        handleBack={handleBack}
                                        isLastStep={isLastStep}
                                        isFirstStep={activeStep === 0}
                                        isLoading={isLoading || block}
                                        formikProps={formikProps}
                                    />
                                </Box>
                            )}
                        </Form>
                    )}
                </Formik>
            </DialogContent>
        </Dialog>
    );
};

export { Wizard };

import { Close as CloseIcon } from '@mui/icons-material';
import { Box, Dialog, DialogContent, DialogTitle, IconButton } from '@mui/material';
import { Form, Formik, FormikConfig, FormikHelpers, FormikProps } from 'formik';
import React, { JSX, PropsWithChildren, useEffect, useState } from 'react';
import * as Yup from 'yup';
import { useDarkModeStore } from '../../stores/darkMode';
import { Stepper } from './stepper';
import { StepperActions } from './stepper/StepperActions';

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
    validationSchema?: any;
    validate?: FormikConfig<T>['validate'];
    stepperActions?: {
        hide?: 'all' | 'back' | 'next';
        back?: { text?: string; onClick?: () => void; disabled?: boolean };
        next?: { text?: string; onClick?: (values: T, formikHelpers: FormikHelpers<T>) => Promise<void> | void; disabled?: boolean };
    };
    invisibleBeforeStep?: boolean;
    alignItems?: 'start';
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
    checkForChanges = true,
}: PropsWithChildren<
    WizardBaseType<T> & {
        initialValues: T;
        title: string;
        steps: StepType<T>[];
        isLoading: boolean;
        submitFunction: (values: T) => Promise<any>;
        direction?: 'row' | 'column';
        showPrevSteps?: boolean;
        checkForChanges?: boolean;
    }
>): JSX.Element | null => {
    const [activeStep, setActiveStep] = useState(initialStep);
    const isLastStep = activeStep === steps.length - 1;

    const [block, setBlock] = useState(false);

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
            slotProps={{ paper: { sx: { bgcolor: darkMode ? '#060606' : 'white' } } }}
            style={{ height: '100%', margin: 'auto' }}
            disableEnforceFocus
        >
            {/* disableEnforceFocus added for 'raqb' component as mentioned in docs https://github.com/ukrbublik/react-awesome-query-builder#api */}
            <DialogTitle sx={{ color: 'primary.main' }} fontSize="20px" fontWeight="600" fontFamily="Rubik">
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
                    <CloseIcon sx={{ color: 'primary.main' }} />
                </IconButton>
            </DialogTitle>
            <DialogContent>
                <Formik
                    initialValues={initialValues}
                    validationSchema={
                        steps[activeStep]?.validationSchema instanceof Yup.ObjectSchema
                            ? steps[activeStep].validationSchema
                            : Yup.object(steps[activeStep]?.validationSchema)
                    }
                    validate={steps[activeStep]?.validate}
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
                            {steps[activeStep].stepperActions?.hide !== 'all' && (
                                <Box sx={{ position: 'sticky', bottom: 0 }}>
                                    <StepperActions
                                        step={steps[activeStep]}
                                        handleBack={handleBack}
                                        isLastStep={isLastStep}
                                        isFirstStep={activeStep === 0}
                                        isLoading={isLoading || block}
                                        formikProps={formikProps}
                                        checkForChanges={checkForChanges}
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

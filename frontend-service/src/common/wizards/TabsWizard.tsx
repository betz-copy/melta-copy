import React, { PropsWithChildren } from 'react';
import { StepType, WizardBaseType } from '.';

const TabsWizard = <T extends object>({
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
                            steps[activeStep].stepperActions?.next?.onClick?.();
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

export { TabsWizard };

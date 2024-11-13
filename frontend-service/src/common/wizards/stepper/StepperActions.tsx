import React from 'react';
import { Button, CircularProgress, Grid } from '@mui/material';
import { ArrowForward as ArrowForwardIcon, ArrowBack as ArrowBackIcon, Done as DoneIcon } from '@mui/icons-material';
import i18next from 'i18next';
import { FormikProps } from 'formik';
import isEqual from 'lodash.isequal';
import { StepType } from '..';

const StepperActions = <T extends object>({
    step,
    handleBack,
    isLastStep,
    isFirstStep,
    isLoading,
    formikProps,
}: {
    step: StepType<T>;
    handleBack: () => void;
    isLastStep: boolean;
    isFirstStep: boolean;
    isLoading: boolean;
    formikProps: FormikProps<T>;
}): JSX.Element | null => {
    const isSameObject = isEqual(formikProps.values, formikProps.initialValues);

    return (
        <Grid container justifyContent="space-between" padding="0px 25px">
            <Grid item>
                {step.stepperActions?.disable !== 'back' && (
                    <Button
                        variant="outlined"
                        onClick={() => {
                            if (step.stepperActions?.handleBack) step.stepperActions?.handleBack();
                            handleBack();
                        }}
                        disabled={isLoading || isFirstStep}
                        style={{ display: isFirstStep ? 'none' : '' }}
                    >
                        <ArrowBackIcon
                            style={{
                                transform: 'scaleX(-1)',
                            }}
                        />
                        {i18next.t('wizard.back')}
                    </Button>
                )}
            </Grid>
            <Grid item>
                {/* type submit for formik goto next step */}
                {step.stepperActions?.disable !== 'next' && (
                    <Button type="submit" variant="contained" disabled={isLoading || (isLastStep && isSameObject)}>
                        {i18next.t(isLastStep ? 'wizard.finish' : 'wizard.next')}
                        {isLoading && <CircularProgress size={20} />}
                        {isLastStep ? (
                            <DoneIcon />
                        ) : (
                            <ArrowForwardIcon
                                style={{
                                    transform: 'scaleX(-1)',
                                }}
                            />
                        )}
                    </Button>
                )}
            </Grid>
        </Grid>
    );
};

export { StepperActions };

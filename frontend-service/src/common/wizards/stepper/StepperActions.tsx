import { ArrowBack as ArrowBackIcon, ArrowForward as ArrowForwardIcon, Done as DoneIcon } from '@mui/icons-material';
import { Button, CircularProgress, Grid } from '@mui/material';
import { FormikProps } from 'formik';
import i18next from 'i18next';
import isEqual from 'lodash.isequal';
import { JSX } from 'react';
import { StepType } from '..';

const StepperActions = <T extends object>({
    step,
    handleBack,
    isLastStep,
    isFirstStep,
    isLoading,
    formikProps,
    checkForChanges,
}: {
    step: StepType<T>;
    handleBack: () => void;
    isLastStep: boolean;
    isFirstStep: boolean;
    isLoading: boolean;
    formikProps: FormikProps<T>;
    checkForChanges: boolean;
}): JSX.Element | null => {
    const isSameObject = checkForChanges ? isEqual(formikProps.values, formikProps.initialValues) : undefined;

    return (
        <Grid container justifyContent="space-between" padding="0px 25px">
            <Grid>
                {step.stepperActions?.hide !== 'back' && (
                    <Button
                        variant="outlined"
                        onClick={() => {
                            if (step.stepperActions?.back?.onClick) step.stepperActions?.back?.onClick();
                            else handleBack();
                        }}
                        disabled={isLoading || isFirstStep || step.stepperActions?.back?.disabled}
                        style={{ display: isFirstStep ? 'none' : '', gap: '5px', borderRadius: '7px' }}
                    >
                        <ArrowBackIcon
                            style={{
                                transform: 'scaleX(-1)',
                            }}
                        />
                        {step?.stepperActions?.back?.text ?? i18next.t('wizard.back')}
                    </Button>
                )}
            </Grid>
            <Grid>
                {/* type submit for formik goto next step */}
                {step?.stepperActions?.hide !== 'next' && (
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={isLoading || (isLastStep && isSameObject) || step.stepperActions?.next?.disabled}
                        style={{ gap: '5px', borderRadius: '7px' }}
                    >
                        {step?.stepperActions?.next?.text ?? i18next.t(isLastStep ? 'wizard.finish' : 'wizard.next')}
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

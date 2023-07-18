import React from 'react';
import { Button, CircularProgress, Grid } from '@mui/material';
import { ArrowForward as ArrowForwardIcon, ArrowBack as ArrowBackIcon, Done as DoneIcon } from '@mui/icons-material';
import i18next from 'i18next';
import { FormikProps } from 'formik';
import isEqual from 'lodash.isequal';

const StepperActions = <T extends object>({
    handleBack,
    isLastStep,
    isFirstStep,
    isLoading,
    formikProps,
}: {
    handleBack: () => void;
    isLastStep: boolean;
    isFirstStep: boolean;
    isLoading: boolean;
    formikProps: FormikProps<T>;
}): JSX.Element | null => {
    const isSameObject = isEqual(formikProps.values, formikProps.initialValues);

    return (
        <Grid container justifyContent="space-between">
            <Grid item>
                <Button variant="outlined" onClick={handleBack} disabled={isLoading || isFirstStep}>
                    <ArrowBackIcon
                        style={{
                            transform: 'scaleX(-1)',
                        }}
                    />
                    {i18next.t('wizard.back')}
                </Button>
            </Grid>
            <Grid item>
                {/* type submit for formik goto next step */}
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
            </Grid>
        </Grid >

    );
};

export { StepperActions };

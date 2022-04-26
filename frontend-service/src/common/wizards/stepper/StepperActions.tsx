import React from 'react';
import { Button, CircularProgress, Grid } from '@mui/material';
import { ArrowForward as ArrowForwardIcon, ArrowBack as ArrowBackIcon, Done as DoneIcon } from '@mui/icons-material';
import i18next from 'i18next';

const StepperActions: React.FC<{
    handleBack: () => void;
    isLastStep: boolean;
    isFirstStep: boolean;
    isLoading: boolean;
}> = ({ handleBack, isLastStep, isFirstStep, isLoading }) => {
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
                <Button type="submit" variant="contained" disabled={isLoading}>
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
        </Grid>
    );
};

export { StepperActions };

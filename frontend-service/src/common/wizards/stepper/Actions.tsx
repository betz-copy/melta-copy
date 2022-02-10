import React from 'react';
import { Button, CircularProgress, Grid } from '@mui/material';
import { ArrowForward as ArrowForwardIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import i18next from 'i18next';

const StepperActions: React.FC<{
    handleBack: () => void;
    isLastStep: boolean;
    isLoading: boolean;
}> = ({ handleBack, isLastStep, isLoading }) => {
    return (
        <Grid container justifyContent="space-between">
            <Grid item>
                <Button variant="outlined" onClick={handleBack} disabled={isLoading}>
                    <ArrowBackIcon
                        style={{
                            transform: 'scaleX(-1)',
                        }}
                    />
                    הקודם
                </Button>
            </Grid>
            <Grid item>
                <Button type="submit" variant="contained" disabled={isLoading}>
                    {i18next.t(isLastStep ? 'wizard.finish' : 'wizard.next')}
                    {isLoading ? (
                        <CircularProgress size={20} />
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
